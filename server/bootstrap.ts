import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { z } from 'zod';
import { run, isMySQL, isPostgres, exec } from './db.js';
import { logger } from './middleware/error.js';

// Robust, multi-level Zod structure validation for AI Template JSON configurations
const configObjectSchema = z.object({
  duration: z.number().optional(),
  aspectRatio: z.string().optional(),
  vibe: z.string().optional(),
  resolution: z.string().optional(),
  audioSway: z.boolean().optional(),
  neonBorders: z.boolean().optional(),
  particles: z.string().optional(),
  overlay: z.string().optional(),
  filter: z.string().optional(),
  bassReactive: z.boolean().optional(),
  bpm: z.number().optional(),
  scale: z.string().optional(),
  reverb: z.number().optional(),
  synth_engine: z.string().optional(),
}).catchall(z.any());

const aiTemplateSchema = z.object({
  name: z.string().trim().min(3).max(100),
  type: z.enum(['video', 'music', 'website', 'marketing', 'booking', 'crm', 'ticketing']),
  preview_url: z.string().trim().url().or(z.literal('')),
  config: z.string().trim().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return false;
      }
      return configObjectSchema.safeParse(parsed).success;
    } catch {
      return false;
    }
  }, { message: "config must be a valid serialized JSON object structure matching expectations" }),
  required_tier: z.string().trim().min(2).max(50),
});

const marketingScriptSchema = z.object({
  title: z.string().trim().min(3).max(200),
  visual: z.string().trim().min(5),
  speaker_notes: z.string().trim().min(10),
  order: z.number().int().nonnegative(),
});

/**
 * Memory-safe async stream reader for JSON arrays.
 * Streams objects one-by-one to avoid loading massive arrays into memory.
 */
async function streamJsonArray(filePath: string, onItem: (item: any) => Promise<void>): Promise<void> {
  const startBuffer = Buffer.alloc(2048);
  const handle = await fs.promises.open(filePath, 'r');
  const { bytesRead } = await handle.read(startBuffer, 0, 2048, 0);
  await handle.close();
  
  const startStr = startBuffer.toString('utf8', 0, bytesRead).trim();
  if (!startStr.startsWith('[')) {
    throw new Error(`${path.basename(filePath)} must contain an array`);
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentObjectStr = '';
  let braceDepth = 0;
  let inString = false;
  let isEscaped = false;
  let itemsCount = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip the outer opening and closing brackets of the array if on their own line
    if (trimmed === '[' || trimmed === ']') {
      continue;
    }

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (char === '\\') {
        isEscaped = !isEscaped;
      } else {
        if (char === '"' && !isEscaped) {
          inString = !inString;
        }
        isEscaped = false;
      }

      if (!inString) {
        if (char === '{') {
          if (braceDepth === 0) {
            currentObjectStr = '';
          }
          braceDepth++;
        }
      }

      if (braceDepth > 0) {
        currentObjectStr += char;
      }

      if (!inString) {
        if (char === '}') {
          braceDepth--;
          if (braceDepth === 0) {
            let cleaned = currentObjectStr.trim();
            if (cleaned.endsWith(',')) {
              cleaned = cleaned.slice(0, -1).trim();
            }
            try {
              const item = JSON.parse(cleaned);
              itemsCount++;
              await onItem(item);
            } catch (err: any) {
              logger.warn(`[Bootstrap] Error parsing JSON object: ${err.message}`);
            }
            currentObjectStr = '';
          }
        }
      }
    }
    if (braceDepth > 0) {
      currentObjectStr += '\n';
    }
  }

  if (itemsCount === 0 && startStr !== '[]' && startStr !== '[\n]') {
    throw new Error(`${path.basename(filePath)} must contain a valid JSON array`);
  }
}

/**
 * Enterprise-grade batch insertion for AI Templates
 */
async function batchInsertTemplates(items: any[], mysql: boolean, queryRunner: typeof run): Promise<number> {
  if (items.length === 0) return 0;

  let query = '';
  if (mysql) {
    query = 'INSERT IGNORE INTO ai_templates (name, type, preview_url, config, required_tier) VALUES ';
  } else {
    query = 'INSERT INTO ai_templates (name, type, preview_url, config, required_tier) VALUES ';
  }

  const placeholders: string[] = [];
  const params: any[] = [];

  for (const item of items) {
    placeholders.push('(?, ?, ?, ?, ?)');
    params.push(item.name, item.type, item.preview_url, item.config, item.required_tier);
  }

  query += placeholders.join(', ');

  if (!mysql) {
    query += ' ON CONFLICT(name) DO NOTHING';
  }

  const result = await queryRunner(query, params);
  if (result) {
    return result.changes || (result as any).affectedRows || items.length;
  }
  return items.length;
}

/**
 * Enterprise-grade batch insertion for Marketing Scripts
 */
async function batchInsertScripts(items: any[], mysql: boolean, queryRunner: typeof run): Promise<number> {
  if (items.length === 0) return 0;

  let query = '';
  if (mysql) {
    query = 'INSERT IGNORE INTO marketing_scripts (title, visual, speaker_notes, display_order) VALUES ';
  } else {
    query = 'INSERT INTO marketing_scripts (title, visual, speaker_notes, display_order) VALUES ';
  }

  const placeholders: string[] = [];
  const params: any[] = [];

  for (const item of items) {
    placeholders.push('(?, ?, ?, ?)');
    params.push(item.title, item.visual, item.speaker_notes, item.order);
  }

  query += placeholders.join(', ');

  if (!mysql) {
    query += ' ON CONFLICT(title) DO NOTHING';
  }

  const result = await queryRunner(query, params);
  if (result) {
    return result.changes || (result as any).affectedRows || items.length;
  }
  return items.length;
}

/**
 * Helper to check file existence asynchronously without blocking
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function bootstrapData() {
  if (process.env.RUN_BOOTSTRAP !== 'true') {
    logger.info('[Bootstrap] Skipping data bootstrap/seeding (RUN_BOOTSTRAP variable is not set to "true").');
    return;
  }

  const mysql = isMySQL();
  const postgres = isPostgres();

  logger.info('[Bootstrap] ⚡ Starting db seed transaction...');
  await exec(mysql ? 'START TRANSACTION' : 'BEGIN');

  try {
    const templatesPath = path.join(process.cwd(), 'server', 'seed-data', 'templates.json');
    const scriptsPath = path.join(process.cwd(), 'server', 'seed-data', 'scripts.json');

    const hasTemplates = await fileExists(templatesPath);
    const hasScripts = await fileExists(scriptsPath);

    if (!hasTemplates || !hasScripts) {
      logger.warn('[Bootstrap] ⚠️ Seeding data JSON files missing. Skipping database bootstrap.');
      await exec(mysql ? 'ROLLBACK' : 'COMMIT');
      return;
    }

    // 1. Acquire Database lock first to serialize multi-container instances cleanly
    if (postgres) {
      logger.info('[Bootstrap] Acquiring PostgreSQL transaction-level advisory lock (9999)...');
      await exec('SELECT pg_advisory_xact_lock(9999)');
    } else if (mysql) {
      logger.info('[Bootstrap] Acquiring MySQL session lock...');
      const lockRes = await run('SELECT GET_LOCK("sonicstream_bootstrap_lock", 15) as has_lock');
      logger.info(`[Bootstrap] MySQL GET_LOCK response: ${JSON.stringify(lockRes)}`);
    }

    // 2. Process, validate, and batch write AI Templates in a stream-safe manner
    let templatesInsertedCount = 0;
    let templatesProcessedCount = 0;
    const templateBatch: any[] = [];
    const BATCH_SIZE = 50;

    logger.info('[Bootstrap] 🔄 Validating and inserting AI templates streamingly in batches...');
    await streamJsonArray(templatesPath, async (item) => {
      const parsed = aiTemplateSchema.safeParse(item);
      if (parsed.success) {
        templateBatch.push(parsed.data);
        templatesProcessedCount++;
        if (templateBatch.length >= BATCH_SIZE) {
          const inserted = await batchInsertTemplates(templateBatch, mysql, run);
          templatesInsertedCount += inserted;
          templateBatch.length = 0;
        }
      } else {
        logger.warn(`[Bootstrap] ⚠️ Rejected invalid AI template item: ${JSON.stringify(item)}. Error: ${JSON.stringify(parsed.error.format())}`);
      }
    });

    // Flush remaining templates
    if (templateBatch.length > 0) {
      const inserted = await batchInsertTemplates(templateBatch, mysql, run);
      templatesInsertedCount += inserted;
    }

    // 3. Process, validate, and batch write Marketing Scripts in a stream-safe manner
    let scriptsInsertedCount = 0;
    let scriptsProcessedCount = 0;
    const scriptBatch: any[] = [];

    logger.info('[Bootstrap] 🔄 Validating and inserting marketing scripts streamingly in batches...');
    await streamJsonArray(scriptsPath, async (item) => {
      const parsed = marketingScriptSchema.safeParse(item);
      if (parsed.success) {
        scriptBatch.push(parsed.data);
        scriptsProcessedCount++;
        if (scriptBatch.length >= BATCH_SIZE) {
          const inserted = await batchInsertScripts(scriptBatch, mysql, run);
          scriptsInsertedCount += inserted;
          scriptBatch.length = 0;
        }
      } else {
        logger.warn(`[Bootstrap] ⚠️ Rejected invalid marketing script item: ${JSON.stringify(item)}. Error: ${JSON.stringify(parsed.error.format())}`);
      }
    });

    // Flush remaining scripts
    if (scriptBatch.length > 0) {
      const inserted = await batchInsertScripts(scriptBatch, mysql, run);
      scriptsInsertedCount += inserted;
    }

    // 4. Release MySQL lock if mysql was used
    if (mysql) {
      await exec('SELECT RELEASE_LOCK("sonicstream_bootstrap_lock")').catch(() => {});
    }

    await exec('COMMIT');
    logger.info(`[Bootstrap] ✅ Seeding completed inside atomic transaction: processed ${templatesProcessedCount} templates (inserted ${templatesInsertedCount}) & ${scriptsProcessedCount} scripts (inserted ${scriptsInsertedCount}).`);

  } catch (err: any) {
    try {
      if (mysql) {
        await exec('SELECT RELEASE_LOCK("sonicstream_bootstrap_lock")').catch(() => {});
      }
      await exec('ROLLBACK');
      logger.info('[Bootstrap] ↩️ Seeding transaction rolled back successfully.');
    } catch (rbErr) {
      logger.error('[Bootstrap] ⚠️ Failed to roll back transaction:', rbErr);
    }
    logger.error('[Bootstrap] ❌ Failed to run safely engineered DB bootstrap:', err);
  }
}

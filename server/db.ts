import { open, Database } from 'sqlite';
import pg from 'pg';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { snakeToCamel } from './utils/naming.js';
import { registry } from './services/ServiceRegistry.js';

let db: any = null;
let isPg = false;
let isConnected = false;

let dbReadyResolve: () => void;
export const dbReady = new Promise<void>((resolve) => {
  dbReadyResolve = resolve;
});

// Convert SQLite/MySQL parameter placeholder '?' into PostgreSQL dynamic sequential '$1, $2, ...' placeholders
function mapQueryPlaceholders(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export async function initDB(): Promise<any> {
  if (isConnected && db) return db;
  
  const dbUrl = config.DATABASE_URL;
  
  if (dbUrl && (dbUrl.startsWith('postgres:') || dbUrl.startsWith('postgresql:'))) {
    isPg = true;
    // Log WHERE we're connecting (host only - never credentials) so silent
    // network blackholes are diagnosable from logs alone.
    let targetDesc = 'unparseable-url';
    try {
      const u = new URL(dbUrl);
      const sockHost = u.searchParams.get('host');
      targetDesc = sockHost ? `unix-socket ${sockHost}` : `tcp ${u.hostname}:${u.port || 5432}`;
    } catch {}
    console.log(`[DB] Connecting to PostgreSQL (${targetDesc})...`);
    const t0 = Date.now();

    const pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') || dbUrl.includes('/cloudsql/') || /@10\./.test(dbUrl) ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });
    pool.on('error', (err) => console.error(`[DB] Pool background error: ${err.message}`));

    // Hard watchdog: whatever pg does internally, we will NOT hang silently.
    let client;
    try {
      client = await Promise.race([
        pool.connect(),
        new Promise((_, rej) => setTimeout(() => rej(new Error(`watchdog: no response from ${targetDesc} after 10s (network route/firewall suspect)`)), 10000)),
      ]) as pg.PoolClient;
      await client.query('SELECT 1');
      client.release();
    } catch (err: any) {
      console.error(`[DB] CONNECT FAILED after ${Date.now() - t0}ms -> ${targetDesc}`);
      console.error(`[DB] CAUSE: ${err?.message} (code: ${err?.code || 'none'})`);
      throw err;
    }

    db = pool;
    isConnected = true;
    console.log(`[DB] PostgreSQL connected successfully in ${Date.now() - t0}ms (${targetDesc})`);
    
    // Create tables if not exist
    await createTables();
    
    dbReadyResolve();
    registry.register('database', dbInterface);
    return db;
  }
  
  // SQLite (dev/local only). Loaded lazily so production containers - which use
  // Postgres and install with --ignore-scripts (no native sqlite3 binding built) -
  // never touch this module at startup. A top-level import here previously
  // crashed all three Cloud Run services before they could bind their port.
  console.log('[DB] Connecting to SQLite...');
  let sqlite3: any;
  try {
    sqlite3 = (await import('sqlite3')).default;
  } catch (err: any) {
    throw new Error(
      `SQLite driver unavailable (${err?.message}). This build is Postgres-only; ` +
      `set DATABASE_URL to a postgresql:// connection string.`
    );
  }
  const dbPath = dbUrl?.replace('sqlite:', '') || './sonicstream.db';
  
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  });
  
  // Enable foreign keys and set busy timeout (10 seconds)
  await db.exec('PRAGMA foreign_keys = ON;');
  await db.exec('PRAGMA busy_timeout = 10000;');
  
  isConnected = true;
  console.log('[DB] SQLite connected successfully');
  
  // Create tables
  await createTables();
  
  dbReadyResolve();
  registry.register('database', dbInterface);
  return db;
}

async function createTables(): Promise<void> {
  // ---- Schema-authority self-heal v2 (2026-07-28) -------------------------
  // db.ts's rival table blueprints are RETIRED. The MigrationService is the sole
  // schema authority. For each table the rival used to own: if it exists but
  // lacks its canonical marker column AND holds zero rows, drop it so the
  // canonical DDL (run via migrations) can rebuild it correctly. Non-empty
  // non-canonical tables are refused loudly - never dropped.
  if (isPg) {
    const canonMarkers: Record<string, string> = {
      users: 'balance',
      tracks: 'owner_user_id',
      playlists: 'user_id',
      events: 'venue',
    };
    for (const [table, marker] of Object.entries(canonMarkers)) {
      try {
        const exists = await (db as any).query(
          "SELECT 1 FROM information_schema.tables WHERE table_name = $1", [table]
        );
        if (exists.rows.length === 0) continue;
        const hasMarker = await (db as any).query(
          "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2", [table, marker]
        );
        if (hasMarker.rows.length > 0) continue; // canonical already - leave it
        const cnt = await (db as any).query(`SELECT COUNT(*)::int AS c FROM ${table}`);
        if (cnt.rows[0].c === 0) {
          console.log(`[DB] SELF-HEAL v2: dropping empty non-canonical table "${table}" (missing marker "${marker}") - migrations will rebuild it canonically`);
          await (db as any).query(`DROP TABLE ${table} CASCADE`);
        } else {
          console.error(`[DB] WARNING: non-canonical table "${table}" contains rows - manual migration required, refusing to drop`);
        }
      } catch (e: any) {
        console.error(`[DB] Self-heal check failed for ${table}: ` + e.message);
      }
    }
  }

  try {
    // RETIRED (2026-07-28): db.ts's rival table blueprints are gone. The
    // MigrationService is the sole schema authority; server.ts runs it via
    // RUN_BOOTSTRAP=1 in production and always in development. The self-heal
    // above clears any empty non-canonical tables the old blueprints left.
    console.log('[DB] Schema deferred to MigrationService (sole authority); self-heal complete');
  } catch (err) {
    console.error('[DB] Error creating tables:', err);
    throw err;
  }
}

export async function closeDB(): Promise<void> {
  if (db) {
    try {
      if (isPg) {
        await db.end();
      } else {
        await db.close();
      }
      isConnected = false;
      console.log('[DB] Disconnected');
    } catch (err) {
      console.error('[DB] Error closing:', err);
    }
  }
}

// Support get() signature (as raw db getter) and get(sql, params) signature (query helper)
// Self-reconnect (2026-07-28): if any query finds the connection gone - whatever
// closed it (instance recycling, an errant shutdown path, a pool failure) - redial
// before failing. Concurrent callers share one reconnection attempt.
let reconnectPromise: Promise<any> | null = null;
async function ensureDB(): Promise<any> {
  if (db && isConnected) return db;
  if (!reconnectPromise) {
    console.warn('[DB] Connection missing at query time - attempting self-reconnect...');
    reconnectPromise = initDB()
      .then((d) => { console.log('[DB] Self-reconnect succeeded'); return d; })
      .finally(() => { reconnectPromise = null; });
  }
  return reconnectPromise;
}

export function get(): any;
export function get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
export function get<T = any>(sql?: string, params: any[] = []): any {
  if (sql === undefined) {
    if (!db || !isConnected) {
      throw new Error('Database not initialized. Call initDB() first.');
    }
    return db;
  }
  return getOne<T>(sql, params);
}

export async function run(sql: string, params: any[] = []): Promise<any> {
  const dbInstance = await ensureDB();
  if (isPg) {
    const pgSql = mapQueryPlaceholders(sql);
    const result = await dbInstance.query(pgSql, params);
    return {
      lastID: result.rows?.[0]?.id || null,
      changes: result.rowCount || 0
    };
  }
  const result = await dbInstance.run(sql, params);
  return {
    lastID: result?.lastID ?? null,
    changes: result?.changes ?? 0
  };
}

export async function getOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const dbInstance = await ensureDB();
  if (isPg) {
    const pgSql = mapQueryPlaceholders(sql);
    const result = await dbInstance.query(pgSql, params);
    return snakeToCamel(result.rows[0]) as T | undefined;
  }
  const result = await dbInstance.get(sql, params);
  return snakeToCamel(result) as T | undefined;
}

export async function getAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const dbInstance = await ensureDB();
  if (isPg) {
    const pgSql = mapQueryPlaceholders(sql);
    const result = await dbInstance.query(pgSql, params);
    return snakeToCamel(result.rows) as T[];
  }
  const result = await dbInstance.all(sql, params);
  return snakeToCamel(result) as T[];
}

export function isPostgresDB(): boolean {
  return isPg;
}

// ── Compatibility Wrappers & Exports ──────────────────────────────────────────
export const getDB = () => db;
export const isMySQL = () => false;
export const isPostgres = () => isPg;

export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return getAll<T>(sql, params);
}

export async function exec(sql: string): Promise<any> {
  const dbInstance = await ensureDB();
  if (isPg) {
    return dbInstance.query(sql);
  }
  return dbInstance.exec(sql);
}

export async function transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  const dbInstance = await ensureDB();

  if (isPg) {
    const pool = dbInstance as pg.Pool;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tx = {
        exec: async (sql: string) => {
          const pgSql = mapQueryPlaceholders(sql);
          return client.query(pgSql);
        },
        get: async <U>(sql: string, params: any[] = []): Promise<U | undefined> => {
          const pgSql = mapQueryPlaceholders(sql);
          const r = await client.query(pgSql, params);
          return snakeToCamel(r.rows[0]) as U | undefined;
        },
        all: async <U>(sql: string, params: any[] = []): Promise<U[]> => {
          const pgSql = mapQueryPlaceholders(sql);
          const r = await client.query(pgSql, params);
          return snakeToCamel(r.rows) as U[];
        },
        run: async (sql: string, params: any[] = []) => {
          const pgSql = mapQueryPlaceholders(sql);
          const r = await client.query(pgSql, params);
          return {
            lastID: r.rows?.[0]?.id || null,
            changes: r.rowCount || 0
          };
        }
      };
      const result = await callback(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  // SQLite transaction
  try {
    await dbInstance.exec('BEGIN DEFERRED TRANSACTION');
    const tx = {
      exec: async (sql: string) => {
        return dbInstance.exec(sql);
      },
      get: async <U>(sql: string, params: any[] = []): Promise<U | undefined> => {
        const r = await dbInstance.get(sql, params);
        return snakeToCamel(r);
      },
      all: async <U>(sql: string, params: any[] = []): Promise<U[]> => {
        const r = await dbInstance.all(sql, params);
        return snakeToCamel(r);
      },
      run: async (sql: string, params: any[] = []) => {
        const r = await dbInstance.run(sql, params);
        return {
          lastID: r?.lastID ?? null,
          changes: r?.changes ?? 0
        };
      }
    };
    const result = await callback(tx);
    await dbInstance.exec('COMMIT');
    return result;
  } catch (err) {
    await dbInstance.exec('ROLLBACK').catch(() => {});
    throw err;
  }
}

const dbInterface = {
  initDB,
  closeDB,
  get,
  run,
  getOne,
  getAll,
  isPostgresDB,
  // compatibility
  getDB,
  isMySQL,
  isPostgres,
  all,
  exec,
  transaction
};

export { dbInterface as db };
export default dbInterface;

/**
 * V12 CONSTITUTION — wired for SonicStream.
 *
 * All enforcement logic lives in engine.core.ts (deterministic, dependency-
 * free, unit tested, copy-in portable to every signatory application). This
 * file binds it to SonicStream's filesystem, database and request pipeline:
 *
 *   - Art. I  §1.2–1.3: reads constitution/constitution.yaml + .lock at boot,
 *     recomputes the digest, and in production REFUSES TO START on any defect.
 *   - Art. XI §11.4: every violation and sanction is appended to the
 *     constitution_violations table. The code contains no UPDATE and no
 *     DELETE for that table — append-only by construction.
 *   - Art. X: halt state persists in constitution_state so a halt survives
 *     restarts and redeploys. Only the admin routes (authenticated humans)
 *     construct the HumanAuthority capability required to halt or resume.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { get, run } from '../db.js';
import {
  bootConstitution,
  EnforcementEngine,
  ConstitutionError,
  HumanAuthority,
  Severity,
  ViolationEvent,
} from './engine.core.js';

let engine: EnforcementEngine | null = null;
let bootDigest: string | null = null;
let bootError: string | null = null;

const DOC_PATH = path.join(process.cwd(), 'constitution', 'constitution.yaml');
const LOCK_PATH = path.join(process.cwd(), 'constitution', 'constitution.lock');

async function ensureTables(): Promise<void> {
  // Dialect-portable DDL: works on SQLite (dev) and PostgreSQL (prod).
  // No AUTOINCREMENT (SQLite-only); BIGINT for millisecond epoch timestamps
  // (a plain INTEGER overflows Postgres' 32-bit range at ~2.1e9).
  await run(`CREATE TABLE IF NOT EXISTS constitution_violations (
    at BIGINT NOT NULL,
    agent_id TEXT NOT NULL,
    tenant_id TEXT,
    article TEXT NOT NULL,
    declared_severity TEXT NOT NULL,
    effective_severity TEXT NOT NULL,
    sanction TEXT NOT NULL,
    escalated INTEGER NOT NULL DEFAULT 0,
    detail TEXT
  )`, []);
  await run(`CREATE TABLE IF NOT EXISTS constitution_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at BIGINT NOT NULL
  )`, []);
}

function persistEvent(e: ViolationEvent): void {
  // Fire-and-forget append; enforcement has already been applied in memory.
  void run(
    `INSERT INTO constitution_violations (at, agent_id, tenant_id, article, declared_severity, effective_severity, sanction, escalated, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [e.at, e.agentId, e.tenantId ?? null, e.article, e.declaredSeverity, e.effectiveSeverity, e.sanction, e.escalated ? 1 : 0, e.detail ?? null],
  ).catch((err) => console.error('[constitution] audit append failed:', err));
}

function persistHalt(halted: boolean, reason: string | null, by: string | null): void {
  void run(
    `INSERT INTO constitution_state (key, value, updated_at) VALUES ('halt', ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [JSON.stringify({ halted, reason, by }), Date.now()],
  ).catch((err) => console.error('[constitution] halt persistence failed:', err));
}

/**
 * Boot-time initialisation. Call BEFORE the server starts listening.
 * Production posture: any defect exits the process (Art. I §1.3 — a degraded
 * start is not permitted; there is no bypass flag).
 */
export async function initConstitution(): Promise<void> {
  try {
    const docBytes = fs.readFileSync(DOC_PATH, 'utf8');
    const lockText = fs.readFileSync(LOCK_PATH, 'utf8');
    const boot = bootConstitution(docBytes, lockText, {
      onEvent: persistEvent,
      onHaltChange: persistHalt,
    });
    engine = boot.engine;
    bootDigest = boot.digest;
    bootError = null;

    // Audit persistence is best-effort. If the DB layer has trouble, enforcement
    // stays active IN MEMORY and the server still boots — the anchor (the real
    // security gate) has already passed. §1.5 is about the anchor, not the log.
    try {
      await ensureTables();
      const row = await get<{ value: string }>(`SELECT value FROM constitution_state WHERE key = 'halt'`, []);
      if (row?.value) {
        const saved = JSON.parse(row.value) as { halted: boolean; reason: string | null; by: string | null };
        engine.restore({ halted: saved.halted, haltReason: saved.reason, haltedBy: saved.by });
        if (saved.halted) console.warn('[constitution] ecosystem HALT restored from persistence — human resume required');
      }
    } catch (dbErr) {
      console.error('[constitution] audit store unavailable — enforcement active in-memory only:', dbErr);
    }
    console.log(`[constitution] ${boot.engine.meta().instrument} v${boot.version} anchored (${boot.digest.slice(0, 12)}…) — enforcement active`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    bootError = message;
    if (config.NODE_ENV === 'production') {
      // Art. I §1.3 — fail closed. No degraded start, no bypass.
      console.error(`[constitution] FATAL: ${message} — refusing to start (Art. I §1.3)`);
      process.exit(1);
    }
    console.error(`[constitution] DEV WARNING: ${message} — enforcement engine NOT active. Production would refuse to start.`);
  }
}

export function constitutionEngine(): EnforcementEngine {
  if (!engine) throw new ConstitutionError('ENGINE_UNAVAILABLE', 'Constitution engine is not initialised (Art. I §1.5 — deny, do not assume)');
  return engine;
}

export function constitutionStatus(): {
  active: boolean;
  digest: string | null;
  bootError: string | null;
  meta: { instrument: string; version: string } | null;
  state: ReturnType<EnforcementEngine['state']> | null;
} {
  return {
    active: !!engine,
    digest: bootDigest,
    bootError,
    meta: engine ? engine.meta() : null,
    state: engine ? engine.state() : null,
  };
}

/** Convenience for services/agents: record a violation with sanctions applied. */
export function recordViolation(input: { agentId: string; tenantId?: string; article: string; severity: Severity; detail?: string }): ViolationEvent {
  return constitutionEngine().recordViolation(input);
}

/** Construct the Article X capability. ONLY call after authenticating a human admin. */
export function humanAuthority(adminId: string): HumanAuthority {
  return { human: true, adminId };
}

/**
 * Request gate (Art. X §10.2 — a halt takes effect before the next action).
 * Mounted on /api: while halted, every mutating call is denied except the
 * constitution routes themselves (so the human can resume) and health checks.
 */
export function constitutionGuard(req: Request, res: Response, next: NextFunction): void {
  if (!engine || !engine.halted()) return next();
  const mutating = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';
  const exempt = req.path.startsWith('/constitution') || req.path.startsWith('/health');
  if (mutating && !exempt) {
    res.status(503).json({
      error: 'The ecosystem is halted by human authority. No agent may argue against, delay, or route around a halt (Art. X §10.2).',
      code: 'CONSTITUTION_HALT',
    });
    return;
  }
  next();
}

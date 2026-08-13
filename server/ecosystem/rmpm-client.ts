/**
 * SonicStream ↔ R.M.P.M marketing channel.
 *
 * Outbound: SonicStream asks RMPM for the marketing tools/assets needed to
 *           accomplish a task. Every request MANDATES a deep dive.
 * Inbound:  RMPM sends marketing data (tools, audiences, campaigns) back to
 *           SonicStream's feed intake; those events are captured here as
 *           reusable `marketing_assets` the app can market and promote with.
 *
 * Transport is the signed V12 ecosystem envelope (V12-Signature), identical to
 * the rest of the mesh, so RMPM accepts it with the shared ECOSYSTEM_SECRET.
 */
import crypto from 'node:crypto';
import { run, all, isPostgres } from '../db.js';

const SELF = 'sonicstream';
const RMPM_PATH = process.env.RMPM_FEED_PATH || '/api/v1/ecosystem/feed/events';

function sharedSecret(): string {
  return (
    process.env.V12_RMPM_WEBHOOK_SECRET ||
    process.env.V12_WEBHOOK_SECRET ||
    process.env.ECOSYSTEM_SECRET ||
    ''
  );
}

function signature(body: string): string {
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac('sha256', sharedSecret()).update(`${t}.${body}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(5).toString('hex')}`;
}

let tablesReady = false;
async function ensureTables(): Promise<void> {
  if (tablesReady) return;
  const intCol = isPostgres() ? 'BIGINT' : 'INTEGER';
  await run(
    `CREATE TABLE IF NOT EXISTS rmpm_requests (
       id TEXT PRIMARY KEY, correlation_id TEXT, task TEXT, context TEXT,
       deep_dive INTEGER DEFAULT 1, status TEXT, created_at ${intCol} )`
  );
  await run(
    `CREATE TABLE IF NOT EXISTS marketing_assets (
       id TEXT PRIMARY KEY, source TEXT, type TEXT, correlation_id TEXT,
       payload TEXT, received_at ${intCol} )`
  );
  tablesReady = true;
}

export interface MarketingRequestResult {
  ok: boolean;
  correlationId: string;
  requestId: string;
  deepDive: true;
  status?: number;
  error?: string;
}

/**
 * Ask RMPM for the marketing tools needed for a task. Deep dive is ALWAYS on.
 */
export async function requestMarketingTools(input: {
  task: string;
  context?: unknown;
  userId?: string;
}): Promise<MarketingRequestResult> {
  await ensureTables();
  const correlationId = newId('rmpmreq');
  const requestId = newId('ss');

  const payload = {
    task: input.task,
    context: input.context ?? null,
    // Mandatory deep-dive directive on every request.
    deepDive: true,
    directive:
      'Perform a DEEP DIVE and return the complete marketing toolkit needed to accomplish this task: ' +
      'target audiences, channel plan, creative assets, copy, budget guidance, and a measurable campaign outline.',
    requestedBy: input.userId ?? null,
    requestedAt: Date.now(),
  };

  const envelope = {
    id: requestId,
    type: 'marketing.assist.requested',
    version: '1.0',
    source: SELF,
    occurredAt: new Date().toISOString(),
    correlationId,
    subjectUserId: input.userId,
    payload,
  };
  const body = JSON.stringify(envelope);

  await run(
    `INSERT INTO rmpm_requests (id, correlation_id, task, context, deep_dive, status, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [requestId, correlationId, input.task, JSON.stringify(input.context ?? null), 'pending', Date.now()]
  );

  const base = process.env.RMPM_URL;
  if (!base) {
    await run('UPDATE rmpm_requests SET status = ? WHERE id = ?', ['rmpm_url_unset', requestId]);
    return { ok: false, correlationId, requestId, deepDive: true, error: 'RMPM_URL is not configured' };
  }
  if (!sharedSecret()) {
    await run('UPDATE rmpm_requests SET status = ? WHERE id = ?', ['no_secret', requestId]);
    return { ok: false, correlationId, requestId, deepDive: true, error: 'No shared secret configured' };
  }

  try {
    const res = await fetch(base.replace(/\/$/, '') + RMPM_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-V12-Service': SELF, 'V12-Signature': signature(body) },
      body,
    });
    await run('UPDATE rmpm_requests SET status = ? WHERE id = ?', [res.ok ? `delivered_${res.status}` : `rejected_${res.status}`, requestId]);
    return { ok: res.ok, status: res.status, correlationId, requestId, deepDive: true };
  } catch (e: any) {
    await run('UPDATE rmpm_requests SET status = ? WHERE id = ?', ['dispatch_error', requestId]);
    return { ok: false, correlationId, requestId, deepDive: true, error: e?.message || 'dispatch failed' };
  }
}

/**
 * Capture marketing data RMPM sends back (called from the feed-intake onEvent
 * hook for `marketing.*` events sourced from rmpm).
 */
export async function recordInboundMarketing(env: {
  id: string;
  type: string;
  source: string;
  correlationId?: string;
  payload?: unknown;
}): Promise<void> {
  await ensureTables();
  await run(
    `INSERT INTO marketing_assets (id, source, type, correlation_id, payload, received_at)
     VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
    [env.id, env.source, env.type, env.correlationId ?? null, JSON.stringify(env.payload ?? {}), Date.now()]
  );
  // Mark the originating request answered, if we can correlate it.
  if (env.correlationId) {
    await run('UPDATE rmpm_requests SET status = ? WHERE correlation_id = ?', ['answered', env.correlationId]);
  }
}

export async function listRmpmRequests(limit = 50): Promise<any[]> {
  await ensureTables();
  return all<any>('SELECT * FROM rmpm_requests ORDER BY created_at DESC LIMIT ?', [Math.min(Math.max(limit, 1), 200)]);
}

export async function listMarketingAssets(limit = 50): Promise<any[]> {
  await ensureTables();
  const rows = await all<any>('SELECT * FROM marketing_assets ORDER BY received_at DESC LIMIT ?', [Math.min(Math.max(limit, 1), 200)]);
  return rows.map((r) => {
    let payload: any = {};
    try { payload = r.payload ? JSON.parse(r.payload) : {}; } catch { /* ignore */ }
    return { id: r.id, source: r.source, type: r.type, correlationId: r.correlationId ?? r.correlation_id, payload, receivedAt: Number(r.receivedAt ?? r.received_at) };
  });
}

/**
 * HEADLESS FINANCIAL CLIENT — the V12 accounting system of record.
 *
 * Rule (set by ownership): whenever monetary account resources are touched —
 * sales, royalties, sponsorships, payouts — the movement is recorded with
 * Headless Financial. SonicStream's local ledger remains the operational
 * mirror (fast reads, balanced double-entry), but Headless Financial holds
 * the books.
 *
 * Transport: the same signed V12 envelope wire as everything else
 * (V12-Signature over raw body). Fail-safe by design: if Headless Financial
 * is unreachable, the record is appended to a durable outbox
 * (hf-outbox.jsonl) and retried — a network blip never loses an accounting
 * record, and nothing blocks the user-facing transaction (the local ledger
 * already holds the balanced truth).
 *
 * Configuration:
 *   HEADLESS_FINANCIAL_URL=https://…        (its ecosystem intake base)
 *   V12_HEADLESS_FINANCIAL_WEBHOOK_SECRET   (or shared V12_WEBHOOK_SECRET / ECOSYSTEM_SECRET)
 */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildSignedWebhook } from '../../ecosystem/v12-webhook.js';

const OUTBOX = path.join(process.cwd(), 'hf-outbox.jsonl');
const SELF_ID = 'sonicstream';

export interface HFRecord {
  kind: 'sale' | 'royalty_settlement' | 'sponsorship' | 'payout' | 'refund' | 'adjustment';
  reference: string;                 // local ledger tx id or booking id
  description: string;
  amountCents: number;               // total moved, integer cents
  currency?: string;
  parties: { role: 'buyer' | 'seller' | 'platform' | 'artist' | 'sponsor'; userId?: string; amountCents: number }[];
  metadata?: Record<string, unknown>;
}

function hfSecret(): string | undefined {
  return [
    process.env.V12_HEADLESS_FINANCIAL_WEBHOOK_SECRET,
    process.env.V12_WEBHOOK_SECRET,
    process.env.ECOSYSTEM_SECRET,
  ].find((s) => typeof s === 'string' && s.length >= 32);
}

function hfUrl(): string | null {
  const base = process.env.HEADLESS_FINANCIAL_URL?.trim().replace(/\/$/, '');
  if (!base || !/^https?:\/\//.test(base)) return null;
  const p = process.env.V12_HEADLESS_FINANCIAL_FEED_PATH ?? '/api/ecosystem/feed/events';
  return `${base}${p}`;
}

function envelope(record: HFRecord) {
  // Integer discipline enforced at the boundary (Art. III).
  if (!Number.isInteger(record.amountCents)) throw new Error('HF record amountCents must be integer cents');
  for (const p of record.parties) {
    if (!Number.isInteger(p.amountCents)) throw new Error('HF party amounts must be integer cents');
  }
  return {
    id: `evt_${randomUUID()}`,
    type: 'finance.transaction.recorded',
    version: '1.0',
    source: SELF_ID,
    occurredAt: new Date().toISOString(),
    correlationId: record.reference,
    payload: { ...record, currency: record.currency ?? 'USD', systemOfRecord: 'headless-financial' },
  };
}

async function deliver(env: ReturnType<typeof envelope>): Promise<boolean> {
  const url = hfUrl();
  const secret = hfSecret();
  if (!url || !secret) return false; // not configured yet — outbox holds the books' feed
  try {
    const { headers, body } = buildSignedWebhook(secret, env);
    const res = await fetch(url, { method: 'POST', headers: { ...headers, 'X-V12-Service': SELF_ID }, body });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}

function toOutbox(env: unknown): void {
  try {
    fs.appendFileSync(OUTBOX, JSON.stringify(env) + '\n');
  } catch (err) {
    // Last resort: never throw into the transaction path; the local ledger
    // already holds the balanced record. Log loudly for the operator.
    console.error('[headless-financial] OUTBOX WRITE FAILED — record only in local ledger:', err);
  }
}

/**
 * Record a monetary movement with Headless Financial. Never throws into the
 * caller's transaction path; never silently drops (outbox on any failure).
 */
export async function recordWithHeadlessFinancial(record: HFRecord): Promise<{ delivered: boolean; queued: boolean }> {
  const env = envelope(record);
  const delivered = await deliver(env);
  if (!delivered) {
    toOutbox(env);
    return { delivered: false, queued: true };
  }
  return { delivered: true, queued: false };
}

/** Retry queued records; called periodically and via the admin endpoint. */
export async function flushHFOutbox(limit = 50): Promise<{ retried: number; delivered: number; remaining: number }> {
  let lines: string[] = [];
  try {
    if (fs.existsSync(OUTBOX)) lines = fs.readFileSync(OUTBOX, 'utf8').split('\n').filter(Boolean);
  } catch {
    return { retried: 0, delivered: 0, remaining: 0 };
  }
  if (lines.length === 0) return { retried: 0, delivered: 0, remaining: 0 };

  const batch = lines.slice(0, limit);
  const keep: string[] = [];
  let delivered = 0;
  for (const line of batch) {
    try {
      const ok = await deliver(JSON.parse(line));
      if (ok) delivered++;
      else keep.push(line);
    } catch {
      keep.push(line);
    }
  }
  const remaining = [...keep, ...lines.slice(limit)];
  try {
    fs.writeFileSync(OUTBOX, remaining.length ? remaining.join('\n') + '\n' : '');
  } catch (err) {
    console.error('[headless-financial] outbox rewrite failed:', err);
  }
  return { retried: batch.length, delivered, remaining: remaining.length };
}

export function hfStatus(): { configured: boolean; url: string | null; outboxDepth: number } {
  let depth = 0;
  try {
    if (fs.existsSync(OUTBOX)) depth = fs.readFileSync(OUTBOX, 'utf8').split('\n').filter(Boolean).length;
  } catch { /* readable status only */ }
  return { configured: !!(hfUrl() && hfSecret()), url: hfUrl(), outboxDepth: depth };
}

// Background retry every 10 minutes.
setInterval(() => { void flushHFOutbox().catch(() => {}); }, 10 * 60_000).unref?.();

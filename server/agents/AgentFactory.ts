/**
 * V12 AI Agent Factory
 * ────────────────────
 * An internal fleet of specialized AI agents that continuously analyze and debug
 * SonicStream, produce structured bug/enhancement reports, and syndicate them to
 * the ecosystem operators — V12 OS and NEXION.
 *
 * Design principles (aligned with V12-CONST-001):
 *  - Agents ANALYZE and REPORT. Code-changing execution stays HUMAN-GATED
 *    (Article X/XI): a report can be approved, but the factory never rewrites
 *    production code on its own.
 *  - Everything is real: findings come from live runtime signals (captured
 *    errors, health, config posture) plus a tracked engineering backlog — never
 *    fabricated.
 *  - Reports are signed (V12-Signature) and delivered to V12 OS + NEXION when
 *    their endpoints are configured; otherwise they are persisted and logged.
 */
import crypto from 'node:crypto';
import { run, all, get, isPostgres } from '../db.js';
import { config } from '../config.js';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export interface Finding {
  agent: string;
  category: string;
  severity: Severity;
  title: string;
  detail: string;
  location?: string;
  recommendation: string;
}

export interface FactoryReport {
  id: string;
  createdAt: number;
  summary: string;
  severityCounts: Record<Severity, number>;
  findings: Finding[];
  syndication: { target: string; ok: boolean; status?: number; error?: string }[];
  status: 'open' | 'approved' | 'resolved';
}

// ── Runtime signal capture ───────────────────────────────────────────────────
interface CapturedError { at: number; message: string; route?: string; kind: string; }
const errorRing: CapturedError[] = [];
const RING_MAX = 200;

/** Called from the global error handler to feed the DebugAgent real signals. */
export function captureError(err: any, ctx?: { method?: string; url?: string }): void {
  try {
    const text = String(err?.message || '') + ' ' + String(err?.stack || '');
    const kind = /database|sqlite|postgres|query|pool/i.test(text)
      ? 'database'
      : /redis|ioredis/i.test(text)
        ? 'redis'
        : /stripe|payment|checkout/i.test(text)
          ? 'payments'
          : 'runtime';
    errorRing.push({
      at: Date.now(),
      message: String(err?.message || 'unknown error').slice(0, 500),
      route: ctx ? `${ctx.method ?? ''} ${ctx.url ?? ''}`.trim() : undefined,
      kind,
    });
    if (errorRing.length > RING_MAX) errorRing.splice(0, errorRing.length - RING_MAX);
  } catch {
    /* never let telemetry throw */
  }
}

// ── Specialized agents ───────────────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  specialty: string;
  analyze(): Promise<Finding[]> | Finding[];
}

const DebugAgent: Agent = {
  id: 'debug',
  name: 'Debug & Diagnostics Agent',
  specialty: 'Analyzes captured runtime errors and clusters them into actionable bugs.',
  analyze() {
    if (errorRing.length === 0) return [];
    const byKind = new Map<string, CapturedError[]>();
    for (const e of errorRing) {
      const arr = byKind.get(e.kind) ?? [];
      arr.push(e);
      byKind.set(e.kind, arr);
    }
    const findings: Finding[] = [];
    for (const [kind, errs] of byKind) {
      const top = errs[errs.length - 1];
      const sev: Severity = kind === 'payments' || kind === 'database' ? 'high' : 'medium';
      findings.push({
        agent: 'debug',
        category: `runtime-${kind}`,
        severity: sev,
        title: `${errs.length} recent ${kind} error(s)`,
        detail: `Most recent: "${top.message}"${top.route ? ` on ${top.route}` : ''}.`,
        location: top.route,
        recommendation:
          kind === 'payments'
            ? 'Inspect the Stripe/checkout path and confirm secrets + webhook wiring.'
            : kind === 'database'
              ? 'Verify query dialect portability and connection health.'
              : 'Reproduce, add a regression guard, and patch the handler.',
      });
    }
    return findings;
  },
};

const SecuritySentinel: Agent = {
  id: 'security',
  name: 'Security Sentinel',
  specialty: 'Audits secret/config posture and unsafe defaults.',
  analyze() {
    const findings: Finding[] = [];
    const need: Array<[string, string, Severity]> = [
      ['STRIPE_SECRET_KEY', 'Payments cannot run without the Stripe secret.', 'high'],
      ['STRIPE_WEBHOOK_SECRET', 'Webhook signature verification requires this.', 'high'],
      ['JWT_SECRET', 'Auth token signing requires a strong secret.', 'critical'],
    ];
    for (const [key, why, sev] of need) {
      if (!(config as any)[key] && !process.env[key]) {
        findings.push({
          agent: 'security',
          category: 'config-secret',
          severity: sev,
          title: `Missing ${key}`,
          detail: why,
          recommendation: `Set ${key} in Secret Manager and bind it to the service.`,
        });
      }
    }
    if ((config.APP_URL || '').includes('localhost')) {
      findings.push({
        agent: 'security',
        category: 'config',
        severity: 'low',
        title: 'APP_URL points at localhost',
        detail: 'Canonical/sitemap/share links will advertise localhost in production.',
        recommendation: 'Set APP_URL to the public service URL or custom domain.',
      });
    }
    return findings;
  },
};

const DataIntegrityAgent: Agent = {
  id: 'data-integrity',
  name: 'Data Integrity Agent',
  specialty: 'Tracks any surface still backed by hardcoded/demo data instead of live records.',
  analyze() {
    // Tracked engineering debt: surfaces known to still use in-file demo arrays.
    // The factory reports these so they are remediated to real, DB-backed data.
    const debt: Array<{ where: string; note: string; severity: Severity }> = [
      { where: 'src/features/marketplace/components/CreatorMarketplaceViews.tsx', note: 'Beats/services/tickets rendered from in-file arrays; back with live listings.', severity: 'high' },
      { where: 'src/components/FanAnalytics.tsx', note: 'Fan analytics figures are static; wire to real analytics.', severity: 'medium' },
      { where: 'src/features/booking/EventBookingPage.tsx', note: 'Event/venue data partly static; source from events API.', severity: 'medium' },
      { where: 'src/features/pro/ProAssetLibrary.tsx', note: 'Asset library uses sample entries; back with pro_assets store.', severity: 'low' },
    ];
    return debt.map((d) => ({
      agent: 'data-integrity',
      category: 'hardcoded-data',
      severity: d.severity,
      title: `Live-data migration: ${d.where.split('/').pop()}`,
      detail: d.note,
      location: d.where,
      recommendation: 'Replace in-file demo arrays with a real DB/Firestore-backed source + empty/loading states.',
    }));
  },
};

const FeatureAdvancementAgent: Agent = {
  id: 'advancement',
  name: 'Feature Advancement Agent',
  specialty: 'Proposes high-standard, futuristic enhancements across the platform.',
  analyze() {
    const backlog: Array<{ title: string; detail: string; rec: string; sev: Severity }> = [
      {
        title: 'Deliverable files for beat leases',
        detail: 'Leases charge correctly but stems/downloads are placeholders.',
        rec: 'Attach real deliverable assets (GCS) unlocked on paid + webhook fulfillment.',
        sev: 'medium',
      },
      {
        title: 'Fulfillment on marketplace checkout',
        detail: 'stripe_events records the sale; add per-item fulfillment + buyer receipt.',
        rec: 'Handle checkout.session.completed for kind=marketplace to grant/deliver items.',
        sev: 'medium',
      },
    ];
    return backlog.map((b) => ({
      agent: 'advancement',
      category: 'enhancement',
      severity: b.sev,
      title: b.title,
      detail: b.detail,
      recommendation: b.rec,
    }));
  },
};

const AGENTS: Agent[] = [DebugAgent, SecuritySentinel, DataIntegrityAgent, FeatureAdvancementAgent];

// ── Persistence ──────────────────────────────────────────────────────────────
let tablesReady = false;
async function ensureTables(): Promise<void> {
  if (tablesReady) return;
  await run(
    isPostgres()
      ? `CREATE TABLE IF NOT EXISTS agent_reports (
           id TEXT PRIMARY KEY,
           created_at BIGINT,
           summary TEXT,
           severity_counts TEXT,
           findings TEXT,
           syndication TEXT,
           status TEXT DEFAULT 'open'
         )`
      : `CREATE TABLE IF NOT EXISTS agent_reports (
           id TEXT PRIMARY KEY,
           created_at INTEGER,
           summary TEXT,
           severity_counts TEXT,
           findings TEXT,
           syndication TEXT,
           status TEXT DEFAULT 'open'
         )`
  );
  tablesReady = true;
}

// ── Ecosystem syndication (V12 OS + NEXION) ──────────────────────────────────
function sign(secret: string, body: string): string {
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

async function syndicate(report: FactoryReport): Promise<FactoryReport['syndication']> {
  const secret = process.env.V12_WEBHOOK_SECRET || process.env.ECOSYSTEM_SECRET || '';
  const targets: Array<{ name: string; url?: string }> = [
    { name: 'V12_OS', url: process.env.V12_OS_URL },
    { name: 'NEXION', url: process.env.NEXION_URL },
  ];
  const body = JSON.stringify({
    type: 'agent-factory.report.created',
    source: 'sonicstream',
    report: { id: report.id, createdAt: report.createdAt, summary: report.summary, severityCounts: report.severityCounts, findings: report.findings },
  });

  const results: FactoryReport['syndication'] = [];
  for (const t of targets) {
    if (!t.url) {
      results.push({ target: t.name, ok: false, error: 'endpoint not configured' });
      continue;
    }
    if (!secret) {
      results.push({ target: t.name, ok: false, error: 'no signing secret' });
      continue;
    }
    try {
      const res = await fetch(t.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'V12-Signature': sign(secret, body) },
        body,
      });
      results.push({ target: t.name, ok: res.ok, status: res.status });
    } catch (e: any) {
      results.push({ target: t.name, ok: false, error: e?.message || 'dispatch failed' });
    }
  }
  return results;
}

// ── Orchestration ────────────────────────────────────────────────────────────
function makeId(): string {
  return `afr_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

export async function runFactory(): Promise<FactoryReport> {
  await ensureTables();

  const findings: Finding[] = [];
  for (const agent of AGENTS) {
    try {
      findings.push(...(await agent.analyze()));
    } catch (e: any) {
      findings.push({
        agent: agent.id,
        category: 'agent-error',
        severity: 'low',
        title: `${agent.name} failed to run`,
        detail: e?.message || 'unknown',
        recommendation: 'Investigate the agent implementation.',
      });
    }
  }
  findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const severityCounts = findings.reduce(
    (acc, f) => ((acc[f.severity] = (acc[f.severity] ?? 0) + 1), acc),
    { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>
  );

  const summary =
    `V12 Agent Factory scanned ${AGENTS.length} specialties and surfaced ${findings.length} finding(s): ` +
    (Object.entries(severityCounts) as [Severity, number][])
      .filter(([, n]) => n > 0)
      .map(([s, n]) => `${n} ${s}`)
      .join(', ') || 'no issues detected';

  const report: FactoryReport = {
    id: makeId(),
    createdAt: Date.now(),
    summary,
    severityCounts,
    findings,
    syndication: [],
    status: 'open',
  };

  report.syndication = await syndicate(report);

  await run(
    `INSERT INTO agent_reports (id, created_at, summary, severity_counts, findings, syndication, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      report.id,
      report.createdAt,
      report.summary,
      JSON.stringify(severityCounts),
      JSON.stringify(findings),
      JSON.stringify(report.syndication),
      report.status,
    ]
  );

  console.log(`[agent-factory] ${report.id}: ${report.summary}`);
  return report;
}

export async function listReports(limit = 25): Promise<any[]> {
  await ensureTables();
  const rows = await all<any>('SELECT * FROM agent_reports ORDER BY created_at DESC LIMIT ?', [limit]);
  return rows.map(hydrate);
}

export async function getReport(id: string): Promise<any | null> {
  await ensureTables();
  const row = await get<any>('SELECT * FROM agent_reports WHERE id = ?', [id]);
  return row ? hydrate(row) : null;
}

export async function setReportStatus(id: string, status: FactoryReport['status']): Promise<boolean> {
  await ensureTables();
  await run('UPDATE agent_reports SET status = ? WHERE id = ?', [status, id]);
  return true;
}

export function agentRoster(): Array<{ id: string; name: string; specialty: string }> {
  return AGENTS.map((a) => ({ id: a.id, name: a.name, specialty: a.specialty }));
}

function hydrate(row: any) {
  const parse = (v: any, fb: any) => {
    try { return typeof v === 'string' ? JSON.parse(v) : v ?? fb; } catch { return fb; }
  };
  return {
    id: row.id,
    createdAt: Number(row.createdAt ?? row.created_at),
    summary: row.summary,
    severityCounts: parse(row.severityCounts ?? row.severity_counts, {}),
    findings: parse(row.findings, []),
    syndication: parse(row.syndication, []),
    status: row.status,
  };
}

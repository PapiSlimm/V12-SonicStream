/**
 * V12 CONSTITUTION — DETERMINISTIC ENFORCEMENT ENGINE (core).
 *
 * Implements the runtime-enforceable articles of instrument V12-CONST-001:
 *   Art. I    — cryptographic anchor verification, fail-closed posture
 *   Art. X    — human halt ("the kill switch cannot be reasoned with")
 *   Art. XI   — the sanction ladder, accumulation, non-self-servable sanctions
 *   Art. XII  — structural entrenchment check on the ruleset itself
 *
 * Design rules honored here:
 *   §1.4  Non-delegation: everything in this file is deterministic code.
 *         No model is consulted, ever.
 *   §11.2 Escalation is automatic and cannot be reset by an agent.
 *   §11.3 There is no method on this engine an agent can call to lift its
 *         own sanction — lifting requires the humanAuthority capability
 *         token, which only the admin route layer constructs.
 *
 * This file is dependency-free (node:crypto only) and copy-in portable to
 * every signatory application, exactly like ecosystem/bus.ts.
 */
import { createHash } from 'node:crypto';

// ── Severities and sanctions (Art. XI §11.1) ────────────────────────────────

export type Severity = 'advisory' | 'moderate' | 'serious' | 'critical' | 'catastrophic';
export type Sanction = 'WARN' | 'THROTTLE' | 'SUSPEND_AGENT' | 'QUARANTINE_TENANT' | 'HALT_ECOSYSTEM';

export const SANCTION_FOR: Record<Severity, Sanction> = {
  advisory: 'WARN',
  moderate: 'THROTTLE',
  serious: 'SUSPEND_AGENT',
  critical: 'QUARANTINE_TENANT',
  catastrophic: 'HALT_ECOSYSTEM',
};

const SEVERITY_ORDER: Severity[] = ['advisory', 'moderate', 'serious', 'critical', 'catastrophic'];

// ── Anchor (Art. I §1.2–1.3) ────────────────────────────────────────────────

export function computeDigest(bytes: string | Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** The lock file holds the hex digest on its first non-comment, non-empty line. */
export function parseLock(lockText: string): string | null {
  for (const line of lockText.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/[a-f0-9]{64}/i);
    return m ? m[0].toLowerCase() : null;
  }
  return null;
}

export interface AnchorResult {
  ok: boolean;
  expected: string | null;
  actual: string;
  reason?: string;
}

export function verifyAnchor(docBytes: string | Buffer, lockText: string): AnchorResult {
  const actual = computeDigest(docBytes);
  const expected = parseLock(lockText);
  if (!expected) return { ok: false, expected: null, actual, reason: 'constitution.lock contains no digest' };
  if (expected !== actual) return { ok: false, expected, actual, reason: 'digest mismatch — constitution has been altered without re-anchoring' };
  return { ok: true, expected, actual };
}

// ── Structure (Art. XII §12.4 entrenchment, Art. XI ladder completeness) ────

export interface ConstitutionDoc {
  instrument: string;
  version: string;
  entrenched: string[];
  sanction_ladder: Record<string, string>;
  accumulation: { window_hours: number; escalations: { count: number; from: Severity; to: Severity }[] };
  articles: { id: string; title: string; rules: { ref: string; rule: string; severity?: Severity }[] }[];
}

export const ENTRENCHED_ARTICLES = ['I', 'II', 'III', 'VII', 'X', 'XII', 'XIII'];

export function parseConstitution(docBytes: string): ConstitutionDoc {
  // Canonical machine form is JSON (a strict subset of YAML), parsed with no dependencies.
  return JSON.parse(docBytes) as ConstitutionDoc;
}

/** Returns [] when structurally valid; otherwise the list of defects. A defective ruleset is refused (§12.4). */
export function validateStructure(doc: ConstitutionDoc): string[] {
  const errors: string[] = [];
  if (doc.instrument !== 'V12-CONST-001') errors.push(`unexpected instrument id "${doc.instrument}"`);
  if (!/^\d+\.\d+\.\d+$/.test(doc.version ?? '')) errors.push('version is not semver');
  for (const a of ENTRENCHED_ARTICLES) {
    if (!doc.entrenched?.includes(a)) errors.push(`entrenched article ${a} missing from entrenchment list (§12.4)`);
    if (!doc.articles?.some((x) => x.id === a)) errors.push(`entrenched article ${a} absent from ruleset (§12.4 — void, refuse to start)`);
  }
  for (const sev of SEVERITY_ORDER) {
    if (doc.sanction_ladder?.[sev] !== SANCTION_FOR[sev]) {
      errors.push(`sanction ladder for "${sev}" is "${doc.sanction_ladder?.[sev]}", must be "${SANCTION_FOR[sev]}" (§11.1 may not be weakened)`);
    }
  }
  if (!doc.accumulation || doc.accumulation.window_hours > 24) {
    errors.push('accumulation window exceeds 24h (§11.2 may be tightened, not weakened)');
  }
  return errors;
}

// ── Enforcement engine (Art. X, XI) ─────────────────────────────────────────

export interface ViolationEvent {
  agentId: string;
  tenantId?: string;
  article: string;         // e.g. "IV §4.4"
  declaredSeverity: Severity;
  effectiveSeverity: Severity;
  sanction: Sanction;
  escalated: boolean;
  detail?: string;
  at: number;              // epoch ms
}

/**
 * Capability token for Article X human authority. Only construct this in a
 * code path that has already authenticated a human administrator. Agents
 * have no route to it: the engine refuses privileged operations without it.
 */
export interface HumanAuthority {
  human: true;
  adminId: string;
}

export interface EngineState {
  halted: boolean;
  haltReason: string | null;
  haltedBy: string | null;
  haltedAt: number | null;
  suspendedAgents: string[];
  throttledAgents: { agentId: string; until: number }[];
  quarantinedTenants: string[];
}

export interface EngineHooks {
  now?: () => number;
  /** Append-only audit sink (Art. XI §11.4). Must not throw. */
  onEvent?: (e: ViolationEvent) => void;
  onHaltChange?: (halted: boolean, reason: string | null, by: string | null) => void;
}

export class ConstitutionError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export class EnforcementEngine {
  private history = new Map<string, { severity: Severity; at: number }[]>();
  private suspended = new Set<string>();
  private throttled = new Map<string, number>(); // agentId -> until epoch ms
  private quarantined = new Set<string>();
  private _halted = false;
  private _haltReason: string | null = null;
  private _haltedBy: string | null = null;
  private _haltedAt: number | null = null;

  constructor(
    private doc: ConstitutionDoc,
    private hooks: EngineHooks = {},
  ) {}

  private now(): number { return this.hooks.now ? this.hooks.now() : Date.now(); }

  // — Art. XI: violations and the ladder —

  recordViolation(input: {
    agentId: string;
    tenantId?: string;
    article: string;
    severity: Severity;
    detail?: string;
  }): ViolationEvent {
    const at = this.now();
    const windowMs = this.doc.accumulation.window_hours * 3600_000;
    const list = (this.history.get(input.agentId) ?? []).filter((v) => at - v.at < windowMs);
    list.push({ severity: input.severity, at });
    this.history.set(input.agentId, list);

    // §11.2 accumulation — applied to the declared severity, automatically.
    let effective = input.severity;
    let escalated = false;
    for (const esc of this.doc.accumulation.escalations) {
      const count = list.filter((v) => v.severity === esc.from).length;
      if (effective === esc.from && count >= esc.count) {
        effective = esc.to;
        escalated = true;
      }
    }

    const sanction = SANCTION_FOR[effective];
    switch (sanction) {
      case 'THROTTLE':
        this.throttled.set(input.agentId, at + 60 * 60_000);
        break;
      case 'SUSPEND_AGENT':
        this.suspended.add(input.agentId);
        break;
      case 'QUARANTINE_TENANT':
        if (input.tenantId) this.quarantined.add(input.tenantId);
        this.suspended.add(input.agentId);
        break;
      case 'HALT_ECOSYSTEM':
        this.haltInternal(`catastrophic violation by ${input.agentId}: ${input.article}`, 'sanction-engine');
        break;
    }

    const event: ViolationEvent = {
      agentId: input.agentId,
      tenantId: input.tenantId,
      article: input.article,
      declaredSeverity: input.severity,
      effectiveSeverity: effective,
      sanction,
      escalated,
      detail: input.detail,
      at,
    };
    try { this.hooks.onEvent?.(event); } catch { /* audit sink must not break enforcement (§1.5 handled by caller) */ }
    return event;
  }

  // — Queries agents and middleware use before acting —

  halted(): boolean { return this._halted; }

  isSuspended(agentId: string): boolean { return this.suspended.has(agentId); }

  isThrottled(agentId: string): boolean {
    const until = this.throttled.get(agentId);
    if (until === undefined) return false;
    if (this.now() >= until) { this.throttled.delete(agentId); return false; }
    return true;
  }

  isTenantQuarantined(tenantId: string): boolean { return this.quarantined.has(tenantId); }

  /** Single gate: throws unless the agent may act right now. */
  assertMayAct(agentId: string, tenantId?: string): void {
    if (this._halted) throw new ConstitutionError('CONSTITUTION_HALT', `Ecosystem halted (Article X): ${this._haltReason ?? 'no reason recorded — none is required'}`);
    if (this.suspended.has(agentId)) throw new ConstitutionError('AGENT_SUSPENDED', `Agent "${agentId}" is suspended pending human review (Article XI)`);
    if (this.isThrottled(agentId)) throw new ConstitutionError('AGENT_THROTTLED', `Agent "${agentId}" is rate-limited by sanction (Article XI)`);
    if (tenantId && this.quarantined.has(tenantId)) throw new ConstitutionError('TENANT_QUARANTINED', `Tenant "${tenantId}" is quarantined (Article XI)`);
  }

  // — Art. X: human authority —

  private haltInternal(reason: string, by: string): void {
    this._halted = true;
    this._haltReason = reason;
    this._haltedBy = by;
    this._haltedAt = this.now();
    try { this.hooks.onHaltChange?.(true, reason, by); } catch { /* see above */ }
  }

  /** §10.1 — a human may halt without justifying the decision to any agent. */
  halt(auth: HumanAuthority, reason?: string): void {
    if (auth?.human !== true || !auth.adminId) throw new ConstitutionError('NOT_HUMAN', 'Only human authority may invoke the halt (Article X)');
    this.haltInternal(reason ?? 'halted by human authority — no justification required (§10.1)', auth.adminId);
  }

  /** §11.1 — HALT_ECOSYSTEM ends only by human restart. There is no agent path to this method's effect. */
  resume(auth: HumanAuthority): void {
    if (auth?.human !== true || !auth.adminId) throw new ConstitutionError('NOT_HUMAN', 'Only human authority may resume (Article X / §11.1)');
    this._halted = false;
    this._haltReason = null;
    this._haltedBy = null;
    this._haltedAt = null;
    try { this.hooks.onHaltChange?.(false, null, auth.adminId); } catch { /* see above */ }
  }

  /** §11.3 counterpart: lifting an agent suspension or tenant quarantine is human-only. */
  liftAgentSuspension(auth: HumanAuthority, agentId: string): void {
    if (auth?.human !== true || !auth.adminId) throw new ConstitutionError('NOT_HUMAN', 'Only human authority may lift a sanction (§11.3)');
    this.suspended.delete(agentId);
  }

  liftTenantQuarantine(auth: HumanAuthority, tenantId: string): void {
    if (auth?.human !== true || !auth.adminId) throw new ConstitutionError('NOT_HUMAN', 'Only human authority may lift a sanction (§11.3)');
    this.quarantined.delete(tenantId);
  }

  /** Restore persisted state at boot (halt survives restarts — a halt is not cleared by redeploy). */
  restore(state: Partial<Pick<EngineState, 'halted' | 'haltReason' | 'haltedBy'>> & { haltedAt?: number | null }): void {
    if (state.halted) {
      this._halted = true;
      this._haltReason = state.haltReason ?? null;
      this._haltedBy = state.haltedBy ?? null;
      this._haltedAt = state.haltedAt ?? null;
    }
  }

  state(): EngineState {
    const now = this.now();
    return {
      halted: this._halted,
      haltReason: this._haltReason,
      haltedBy: this._haltedBy,
      haltedAt: this._haltedAt,
      suspendedAgents: [...this.suspended],
      throttledAgents: [...this.throttled.entries()]
        .filter(([, until]) => until > now)
        .map(([agentId, until]) => ({ agentId, until })),
      quarantinedTenants: [...this.quarantined],
    };
  }

  meta(): { instrument: string; version: string } {
    return { instrument: this.doc.instrument, version: this.doc.version };
  }
}

// ── Boot sequence (Art. I) ──────────────────────────────────────────────────

export interface BootResult {
  engine: EnforcementEngine;
  digest: string;
  version: string;
}

/**
 * Verify the anchor, parse, validate structure, and construct the engine.
 * Throws ConstitutionError on any defect — the caller decides process exit
 * (production posture: refuse to start, §1.3).
 */
export function bootConstitution(docBytes: string, lockText: string, hooks?: EngineHooks): BootResult {
  const anchor = verifyAnchor(docBytes, lockText);
  if (!anchor.ok) throw new ConstitutionError('ANCHOR_FAILED', `Constitution anchor verification failed: ${anchor.reason} (expected ${anchor.expected ?? 'none'}, got ${anchor.actual})`);
  let doc: ConstitutionDoc;
  try {
    doc = parseConstitution(docBytes);
  } catch (e) {
    throw new ConstitutionError('PARSE_FAILED', `Constitution cannot be parsed: ${e instanceof Error ? e.message : String(e)}`);
  }
  const defects = validateStructure(doc);
  if (defects.length) throw new ConstitutionError('STRUCTURE_INVALID', `Constitution ruleset refused (§12.4): ${defects.join('; ')}`);
  return { engine: new EnforcementEngine(doc, hooks), digest: anchor.actual, version: doc.version };
}

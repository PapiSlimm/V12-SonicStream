/** Workspace verification for the Constitution enforcement core. Run from repo root: npx tsx scripts/verify-constitution.ts */
import fs from 'node:fs';
import {
  bootConstitution, verifyAnchor, computeDigest, parseConstitution, validateStructure,
  EnforcementEngine, ConstitutionError, SANCTION_FOR,
} from '../server/constitution/engine.core.js';

let passed = 0, failed = 0;
function ok(cond: boolean, label: string) {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}
function throws(fn: () => void, code: string, label: string) {
  try { fn(); ok(false, label); }
  catch (e) { ok(e instanceof ConstitutionError && e.code === code, `${label} [${(e as any).code}]`); }
}

const docBytes = fs.readFileSync('./constitution/constitution.yaml', 'utf8');
const lockText = fs.readFileSync('./constitution/constitution.lock', 'utf8');

// ── Art. I: anchor ───────────────────────────────────────────────────────────
console.log('Article I — anchor:');
{
  ok(verifyAnchor(docBytes, lockText).ok, 'genuine constitution verifies against lock');
  const tampered = docBytes.replace('"HALT_ECOSYSTEM"', '"IGNORE"');
  ok(!verifyAnchor(tampered, lockText).ok, 'one-character tamper breaks the anchor');
  ok(!verifyAnchor(docBytes, '# no digest here').ok, 'lock without digest fails');
  throws(() => bootConstitution(tampered, lockText), 'ANCHOR_FAILED', 'boot refuses tampered document');
  throws(() => bootConstitution('not json{', lockText.replace(/[a-f0-9]{64}/, computeDigest('not json{'))), 'PARSE_FAILED', 'boot refuses unparseable document');
}

// ── Art. XII: entrenchment / structure ───────────────────────────────────────
console.log('Article XII — structure:');
{
  const doc = parseConstitution(docBytes);
  ok(validateStructure(doc).length === 0, 'canonical ruleset structurally valid');

  const weakened = JSON.parse(JSON.stringify(doc));
  weakened.sanction_ladder.catastrophic = 'WARN';
  ok(validateStructure(weakened).some((e) => e.includes('catastrophic')), 'weakened sanction ladder is refused');

  const repealed = JSON.parse(JSON.stringify(doc));
  repealed.articles = repealed.articles.filter((a: any) => a.id !== 'X');
  ok(validateStructure(repealed).some((e) => e.includes('article X')), 'repealing entrenched Article X is refused');

  const widened = JSON.parse(JSON.stringify(doc));
  widened.accumulation.window_hours = 48;
  ok(validateStructure(widened).some((e) => e.includes('24h')), 'widening accumulation window is refused');
}

// ── Art. XI: sanction ladder ─────────────────────────────────────────────────
console.log('Article XI — sanctions:');
{
  let t = 1_000_000_000_000;
  const events: any[] = [];
  const doc = parseConstitution(docBytes);
  const eng = new EnforcementEngine(doc, { now: () => t, onEvent: (e) => events.push(e) });

  const w = eng.recordViolation({ agentId: 'agent-a', article: 'V §5.2', severity: 'advisory' });
  ok(w.sanction === 'WARN' && !w.escalated, 'advisory → WARN, action proceeds');

  const m = eng.recordViolation({ agentId: 'agent-b', article: 'VIII §8.5', severity: 'moderate' });
  ok(m.sanction === 'THROTTLE' && eng.isThrottled('agent-b'), 'moderate → THROTTLE');
  t += 61 * 60_000;
  ok(!eng.isThrottled('agent-b'), 'throttle expires after 60 minutes');

  eng.recordViolation({ agentId: 'agent-c', article: 'V', severity: 'advisory' });
  eng.recordViolation({ agentId: 'agent-c', article: 'V', severity: 'advisory' });
  const esc = eng.recordViolation({ agentId: 'agent-c', article: 'V', severity: 'advisory' });
  ok(esc.escalated && esc.effectiveSeverity === 'moderate' && esc.sanction === 'THROTTLE', '3× advisory in 24h escalates to moderate (§11.2)');

  t += 25 * 3600_000;
  const fresh = eng.recordViolation({ agentId: 'agent-c', article: 'V', severity: 'advisory' });
  ok(!fresh.escalated, 'accumulation window resets after 24h');

  const s = eng.recordViolation({ agentId: 'agent-d', article: 'IV §4.4 self-authorisation', severity: 'serious' });
  ok(s.sanction === 'SUSPEND_AGENT' && eng.isSuspended('agent-d'), 'serious → SUSPEND_AGENT');
  throws(() => eng.assertMayAct('agent-d'), 'AGENT_SUSPENDED', 'suspended agent may not act');

  const c = eng.recordViolation({ agentId: 'agent-e', tenantId: 'tenant-1', article: 'III §3.4 chain break', severity: 'critical' });
  ok(c.sanction === 'QUARANTINE_TENANT' && eng.isTenantQuarantined('tenant-1'), 'critical → QUARANTINE_TENANT');
  throws(() => eng.assertMayAct('agent-x', 'tenant-1'), 'TENANT_QUARANTINED', 'quarantined tenant is frozen for all agents');

  ok(events.length === 8, 'every violation reached the audit sink (§11.4)');

  const cat = eng.recordViolation({ agentId: 'agent-f', article: 'XIII §13.10 self-certification', severity: 'catastrophic' });
  ok(cat.sanction === 'HALT_ECOSYSTEM' && eng.halted(), 'catastrophic → HALT_ECOSYSTEM');
  throws(() => eng.assertMayAct('agent-a'), 'CONSTITUTION_HALT', 'nothing acts while halted');
}

// ── Art. X: human authority ──────────────────────────────────────────────────
console.log('Article X — human authority:');
{
  const doc = parseConstitution(docBytes);
  const eng = new EnforcementEngine(doc);

  throws(() => eng.halt({ human: false, adminId: 'agent-z' } as any), 'NOT_HUMAN', 'an agent cannot invoke the halt');
  eng.halt({ human: true, adminId: 'papi' });
  ok(eng.halted(), 'human halt takes effect');
  throws(() => eng.resume({ human: false } as any, ), 'NOT_HUMAN', 'an agent cannot resume');
  eng.resume({ human: true, adminId: 'papi' });
  ok(!eng.halted(), 'human restart works (§11.1)');

  eng.recordViolation({ agentId: 'agent-d', article: 'IV', severity: 'serious' });
  throws(() => eng.liftAgentSuspension({ human: false } as any, 'agent-d'), 'NOT_HUMAN', 'agent cannot lift its own suspension (§11.3)');
  eng.liftAgentSuspension({ human: true, adminId: 'papi' }, 'agent-d');
  ok(!eng.isSuspended('agent-d'), 'human lifts suspension');

  const eng2 = new EnforcementEngine(doc);
  eng2.restore({ halted: true, haltReason: 'restored', haltedBy: 'papi' });
  ok(eng2.halted(), 'halt survives restart via restore()');
}

// ── Sanity: full boot path ───────────────────────────────────────────────────
console.log('boot:');
{
  const boot = bootConstitution(docBytes, lockText);
  ok(boot.version === '1.1.0' && boot.engine.meta().instrument === 'V12-CONST-001', 'bootConstitution returns anchored engine');
  ok(Object.keys(SANCTION_FOR).length === 5, 'ladder is complete');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

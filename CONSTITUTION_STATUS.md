# V12 Constitution — Implementation Status (SonicStream)

**Instrument V12-CONST-001 v1.1.0 · Status as of 2026-08-10**

This is the honest ledger of what is *enforced by running code* in SonicStream
today, versus what is specified and awaiting its enforcement point. Per Art. I
§1.4, everything listed as ENFORCED is deterministic code — no model in the loop.

## Files

| File | Purpose |
|---|---|
| `constitution/V12_CONSTITUTION.md` | The ratified prose instrument |
| `constitution/constitution.yaml` | Canonical machine form (JSON syntax — a strict YAML subset, zero-dependency parse) |
| `constitution/constitution.lock` | SHA-256 anchor (Art. I §1.2) |
| `server/constitution/engine.core.ts` | Deterministic enforcement engine — **copy-in portable to every signatory app**, like `ecosystem/bus.ts` |
| `server/constitution/engine.ts` | SonicStream wiring: boot verify, DB audit trail, halt persistence, request guard |
| `server/routes/constitution.ts` | Article X human-authority routes (admin-only) |
| `scripts/verify-constitution.ts` | 30-test verification suite — `npx tsx scripts/verify-constitution.ts` |

## Article-by-article

| Article | Status in SonicStream | Detail |
|---|---|---|
| **I** Supremacy / fail-closed | **ENFORCED** | Digest recomputed at boot; production refuses to start on mismatch/absence/parse failure (`initConstitution`, called first in `startServer`). Docker image ships the anchor files. No bypass flag exists. |
| **II** Tenant sovereignty | PARTIAL | `tenantIsolation` middleware exists (application layer). §2.1 requires DB-layer RLS — that lands with the Postgres migration; RLS policies are the named next step. §2.3–2.5 specified, not yet built. |
| **III** Determinism of money | PARTIAL | Ledger + double-entry services exist (`ledger.service.ts`); amounts are integer cents (no floats). §3.3 append-only and §3.4 hash chaining are not yet DB-enforced — next step: chain digest column + constraint + the 24h sweep. §3.5 margin floor: no pricing agents run yet. |
| **IV** Expenditure authorisation | SPECIFIED | No agent in SonicStream executes ad spend today, so there is nothing to gate. The comptroller receipt flow becomes enforceable the day AutoPilot or any agent is allowed to spend — engine hooks (`assertMayAct`, severities for §4.4/§4.5) are ready. |
| **V** Explainability | PARTIAL | `AuditService` records actions. The "rationale-before-action" hard gate is not yet wired into AutoPilot; when AutoPilot is enabled it must call the engine first. |
| **VI** Provenance | PARTIAL | `ingestionGuard` middleware + schema validation (zod) at boundaries; TLS via Cloud Run. §6.1 batch anchoring and §6.4 ephemeral ingestion are roadmap. |
| **VII** Lawful content | PARTIAL | Moderation status gates exist on tracks. The Sentinel classifier at *every* ingress (§7.2) and quarantine store (§7.3) are roadmap. §7.6 is enforced by design in the ecosystem bus: inbound payloads are data; only verified scoped tokens authorise anything. |
| **VIII** Perimeter | PARTIAL | Default CORS allowlist, helmet, per-route rate limits, payload ceilings — live. Sentinel weekly hardening agent (§8.2) does not exist yet. §8.6 honored: no code path lets an agent alter these controls. |
| **IX** Comity / Atlas gate | **ENFORCED (SonicStream's side)** | Signed, audience-isolated, scoped service tokens on every cross-app call (`ecosystem/bus.ts`, mounted `/api/ecosystem`, 23 tests). Unsigned inter-app traffic is rejected. The §9.2 decision journey needs Orion Prime/Nexion/V12 OS/ApexAtlas endpoints live — each adopts the same bus + engine. |
| **X** Human authority | **ENFORCED** | Admin-only halt/resume at `/api/constitution/halt|resume`. Halt persists across restarts, denies every mutating API call before it executes (§10.2), and only a verified human can lift it. Agents have no code path to the `HumanAuthority` capability. |
| **XI** Sanctions | **ENFORCED** | Full ladder WARN→THROTTLE→SUSPEND→QUARANTINE→HALT, automatic 24h accumulation (§11.2), human-only lifting (§11.3), append-only `constitution_violations` audit table (§11.4 — code contains no UPDATE/DELETE for it). |
| **XII** Amendment | **ENFORCED (structural)** | Engine refuses any ruleset that weakens the ladder, widens the accumulation window, or drops an entrenched article (§12.4) — verified by tests. The two-human `constitution:amend` signing ceremony is process, enforced by the re-anchoring requirement (any change without a new lock = boot refusal). |
| **XIII** Inspectorate | SPECIFIED | The engine treats agent self-certification and Inspectorate impersonation as `catastrophic` (auto-halt). The Inspectorate itself is humans + a review workflow — it needs its dossier store and certificate issuance built, and by §13.5 it cannot be automated away. Until it exists: under §13.8, **silence is refusal** — which today means agent-initiated releases are simply not permitted. That is the correct fail-closed reading, not a gap. |

## Adoption order for the other signatory apps

Each app on the Desktop (V12 Multimedia, RM PM, ORION PRIME, NEXION, V12 APEX
ATLAS, V12 OS, CEOS, SOCIOFY, HEADLESS FINACIAL, …) adopts identically:

1. Copy `constitution/` (all three files, unmodified — same digest everywhere)
2. Copy `ecosystem/bus.ts` and `server/constitution/engine.core.ts` verbatim
3. Wire the app's own `engine.ts` equivalent (boot verify + audit sink + guard)
4. Set the shared `ECOSYSTEM_SECRET`, its own `APP_ID`, and its peers
5. Run the verification suite

**Recommended first adopter: V12 Multimedia** (head of the body), then RM PM.

## Verification record

- 30/30 constitution engine tests passing (anchor, entrenchment, ladder, human authority)
- 23/23 ecosystem bus tests passing (signing, audience isolation, scopes, handoff)
- Strict TypeScript typecheck clean on both cores

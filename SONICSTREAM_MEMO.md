# SONICSTREAM — SYSTEM MEMO & HANDOFF
**For any AI session working on this codebase. Read this first.**
*Prepared 2026-08-11 after a full build session. Owner: Papi (papislimm@gmail.com).*

---

## 1. WHAT SONICSTREAM IS

SonicStream (repo: `Desktop\SONIC STREAM`, GitHub: `PapiSlimm/V12-SonicStream`) is the
**audio distribution and streaming hub of the V12 Multimedia ecosystem** — a for-profit
platform where artists stream, sell, broadcast, build sites, and get paid. It is a
direct-interface origin app under the V12 Constitution (instrument V12-CONST-001).

**Stack:** React 18 + Vite frontend (`src/`), Express + TypeScript backend (`server.ts`
~55KB entry + `server/` domains/routes/services), SQLite dev / Postgres prod via a
`db.ts` wrapper (`get`/`all`/`run`), Prisma schema, Firebase Auth (project
`gen-lang-client-0237733980`), Stripe, Gemini. Built with esbuild → `dist/server.cjs`;
deployed on **Google Cloud Run** (same GCP project as Firebase) as three services:
`sonicstream-server`, `-worker`, `-scheduler` (role via `SONIC_ROLE`). Secrets live in
GCP Secret Manager (`sonicstream-*`); deploys via `deploy-sonicstream.cmd`.
Domain `sonicstream.v12multimedia.com` was NOT resolving as of this session — the
real URL is the `*.run.app` address until domain mapping is confirmed.

## 2. THE V12 ECOSYSTEM — WHERE SONICSTREAM SITS

Signatories (all as sibling folders on the Desktop): **V12 Multimedia** (head of the
body, repo `V12 WEB`), **R.M.P.M** (`RM PM`, Python/FastAPI — quantitative marketing,
Inspectorate, City World, Sentinel), **Orion Prime** (evidence/relay hub), **V12 OS**,
**Headless Financial** (`HEADLESS FINACIAL` — **the accounting system of record**),
**SonicStream** (this app), **Sociofy** (social graph), **CEOS** (executive feed +
V12 Marketplace), **SonicWave** (DAW/collab), plus **Nexion** and **ApexAtlas**
(adjudication/admission) and the Atlas Galaxy.

**Two signed wire protocols connect everything:**
1. **Service-token bus** (`ecosystem/bus.ts`, vendored byte-identical everywhere):
   HMAC service tokens with audience isolation + scopes. SonicStream mounts
   `/api/ecosystem` (ping + SSO `handoff` that creates a local user and issues a JWT).
   Config: `APP_ID=sonicstream`, `ECOSYSTEM_SECRET` (min 32), `V12_PEERS=name=url,...`.
   Fail-closed: peers without a secret = boot error in production.
2. **V12-Signature webhooks** (`ecosystem/v12-webhook.ts`, vendored): Stripe-style
   `t=<unix>,v1=<hmac(t.body)>` envelopes (`{id,type,version:"1.0",source,occurredAt,payload}`).
   - **Outbound:** `server/services/EcosystemPublisher.ts` — `publishToFeeds(type, payload)`
     fans out to `V12_FEED_PEERS` (per-peer secret `V12_<PEER>_WEBHOOK_SECRET` or shared
     `V12_WEBHOOK_SECRET`/`ECOSYSTEM_SECRET`). Auto-hooks: `track.approved` →
     `content.track.available`; `post.created` (w/ media) → `content.media.published`;
     `sale.completed` → `telemetry.activity`. Admin: `POST /api/ecosystem/broadcast`,
     `GET /api/ecosystem/feeds`. Native peer paths preconfigured: sociofy
     `/api/ecosystem/events`, ceos `/api/ecosystem/webhooks/sonicstream`, rmpm
     `/api/v1/ecosystem/feed/events`, default `/api/ecosystem/feed/events`.
   - **Inbound:** `ecosystem/v12-feed-intake.ts` mounted at `/api/ecosystem/feed`
     (BEFORE the JSON parser — HMAC needs raw bytes). Accepted events persist to
     `ecosystem-inbox.jsonl`; browse at `GET /api/ecosystem/feed/inbox`. R.M.P.M
     marketing suggestions (`marketing.suggestion.created`) arrive here.

**What flows where:** SonicStream tracks/posts/sales → Sociofy feed posts, CEOS
Marketplace cards, Orion/Apex/SonicWave inboxes. R.M.P.M reviews every SonicStream
post (Sentinel-classified, scored 0–100, concrete suggestions), sends suggestions back,
auto-drafts campaigns, and launches them only through City World per-destination
clearance + an Inspectorate Certificate of Release. **All money movements are recorded
with Headless Financial** via `server/services/HeadlessFinancial.ts`
(`finance.transaction.recorded` envelopes to `HEADLESS_FINANCIAL_URL`; durable
`hf-outbox.jsonl` retry queue — never lost, never blocking).

## 3. THE CONSTITUTION (NON-NEGOTIABLE)

`constitution/constitution.yaml` + `.lock` (SHA-256 anchor `0a85bf03d55a…`, identical
in every app). `server/constitution/engine.core.ts` (portable, deterministic) +
`engine.ts` (wired). **Verified at boot before anything else; production refuses to
start on any defect. No bypass exists.** Enforced live: Art. X human halt
(`POST /api/constitution/halt|resume`, admin-only, survives restarts, blocks all
mutating API calls), Art. XI sanction ladder (WARN→THROTTLE→SUSPEND→QUARANTINE→HALT,
auto-escalation, append-only `constitution_violations`), Art. XII entrenchment
(weakened rulesets refuse to load). Rules every agent in this codebase follows:
models PROPOSE, deterministic code DISPOSES (Art. I §1.4); money is integer cents,
never floats (Art. III); agents call `assertMayAct(agentId)` before acting; ledger
transactions are balanced double-entry. Docs: `CONSTITUTION_STATUS.md` (honest
article-by-article status), `scripts/verify-constitution.ts` (30 tests).

## 4. MAJOR SUBSYSTEMS BUILT/UPGRADED THIS SESSION

**V12 Radio — synchronized broadcast** (`server/services/RadioEngine.core.ts` + `.ts`,
`server/routes/radio.ts`, client `src/features/radio/RadioLiveClient.ts`; 25 tests):
`/api/radio/:station/now-playing` is a **pure function of the clock** — every listener
gets the same track at the same offset (no streaming infra). Top-20 genre stations
always on the dial. Rotations reshuffle daily, vote-weighted (love +8%/skip −12%),
requests pin every 4th slot, dayparted (sunrise/daytime/peak/late). Heartbeat sessions
(`/session/ping` 30s) → real listener counts + per-artist airplay seconds
(`radio_airplay`). **Royalties:** `POST /api/radio/admin/royalties/settle` splits
`RADIO_ROYALTY_POOL_CENTS` pro-rata by airplay (largest-remainder integer math, sums
exactly) → one balanced ledger transaction → Headless Financial. **AI host:**
`/:station/host-break` — dayparted DJ script that back-announces, teases next, reads
ecosystem-inbox headlines, and leads with the paid sponsor line; Gemini polishes when
keyed, deterministic otherwise; client speaks it via browser TTS (free).
Hourly now-playing syndicates to all feed peers. RadioHub.tsx (34KB, untouched) should
adopt `RadioLiveClient` (drift-corrected sync, heartbeats, vote/request, `crossfade()`).

**Monetization** (`server/services/Monetization.core.ts`, `Sponsorship.ts`,
`HeadlessFinancial.ts`, `server/routes/monetize.ts`, client
`src/features/monetize/share.ts`; 39 tests): **Sellers set any price and net exactly
that** — `priceBreakdown()` grosses up platform fee (free 15% / pro 8% / visionary 5%)
+ processing (2.9%+30¢) into one buyer all-in price; integer cents, sums exact.
Published terms at `/api/monetize/terms` (NET-7, $10 min payout, 14-day refunds, $15
dispute fee; Headless Financial named as system of record). Six personalized earning
avenues at `/opportunities`; pitch at `/why-v12`. **Sharing:** `/share-links` builds
links for the **top 20 worldwide platforms** (15 web intents; Instagram/TikTok/
YouTube/WeChat/Snapchat are copy-mode — no fake intents), every caption carrying the
all-in price. **Sponsorships:** rate card priced from measured listeners
($25/day floor + $0.40/listener), booked via Stripe Checkout, activated → ledger +
HF, host reads the message on air.

**Web builder** (`src/features/builder/`; 27 tests): `DesignAgent.tsx` — canvas-native
professional design agent (propose→checkbox→apply/undo; every change becomes an
ordinary editable block) with AI **Warehouse** (12 drop-in sections) and **Factory**
(concept line → full page draft). Backend `/api/design-agent/*` (Gemini + deterministic
heuristic fallback, constitution-gated, ops sanitized server AND client side via
`agent-ops.ts`). **32 animation presets** (`animations.ts`, incl. 3D pack: door-reveal,
tunnel-zoom, helix, levitate-3d…) as plain CSS in block styles + injected keyframes.
**45 templates** (`templates.ts`: 20 modern styles + 25 intense 3D Motion) via
`TemplateGallery.tsx` — all load as fully editable blocks, nothing locked.

**Payments plumbing:** Stripe code was already complete; the CORRECT webhook endpoint
is **`/api/webhooks/stripe`** (raw-body mount; `/api/payments/webhook` sits behind the
JSON parser and cannot verify signatures — runbook was fixed). `ENABLE_PAYMENTS=true`
gates health checks only. Dockerfiles copy `constitution/` into the image (required —
fail-closed boot would kill a container without it).

## 5. OPERATING RULES & CONVENTIONS (FOLLOW THESE)

- **Never weaken fail-closed behavior.** No bypass flags, no unsigned traffic accepted
  or sent, no float money, no self-lifting sanctions.
- **Secrets:** never in chat/commits. `.gitignore` covers `.env`, DBs, keys, the
  runtime JSONL files. Secrets go in GCP Secret Manager / env. The pre-2026 committed
  secrets are BURNED (rotate, don't reuse).
- **Pattern for new features:** pure deterministic `.core.ts` (dependency-injected,
  tested) + thin wired file + routes; vendored ecosystem files (`bus.ts`,
  `v12-webhook.ts`, `v12-feed-intake.ts`, `engine.core.ts`) are byte-identical across
  apps — change upstream, re-vendor everywhere.
- **Test suites that must stay green:** constitution 30, ecosystem bus 23, feed wire 12,
  RM PM marketing 15, builder 27, radio 25, monetization 39.
- **Committing:** `commit-v12-ecosystem.ps1` (SONIC STREAM folder) commits all seven
  repos safely and can push SonicStream to GitHub.

## 6. CURRENT STATUS — WHAT'S ON vs WAITING

**Built & tested:** everything above. **Waiting on operator switches:**
1. `stabilize-sonicstream.ps1` (SONIC STREAM folder): Stripe test keys → Secret
   Manager, webhook registration, DB password rotation, `ECOSYSTEM_SECRET` creation.
   See `STABILIZE_CHECKLIST.md`. Until run, payments are placeholder.
2. Google sign-in: enable provider + authorized domains in Firebase console (code done).
3. Mesh activation: same `V12_WEBHOOK_SECRET` (or `ECOSYSTEM_SECRET`) in every app +
   real URLs in `V12_FEED_PEERS` / `RMPM_FEED_PEERS` / `HEADLESS_FINANCIAL_URL`.
   Most peer apps are not deployed yet — mock/queue modes hold until they are.
4. `RADIO_ROYALTY_POOL_CENTS` + `ADMIN_EMAILS` (V12 WEB) env values.
5. Frontend adoption: RadioLiveClient into RadioHub; share module into track/store
   pages; an Earnings page on `/api/monetize/opportunities`.
6. Headless Financial app needs its feed intake mounted (drop-in file exists).

**Key docs in the repo:** `ECOSYSTEM.md`, `FEED_SYNDICATION.md`,
`CONSTITUTION_STATUS.md`, `STABILIZE_CHECKLIST.md`, `DEPLOY_RUNBOOK.md`,
`RMPM_MARKETING.md` (in RM PM). This memo: `SONICSTREAM_MEMO.md`.

**Mission, in one line:** SonicStream is the hub where V12 creators earn — every
surface sells, every dollar is deterministic and lands in Headless Financial, every
piece of content travels the whole ecosystem automatically, and the Constitution
governs all of it.

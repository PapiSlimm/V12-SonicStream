# SonicStream — LAUNCH CHECKLIST (2026-07)

## 1. Required environment variables (production)
| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (falls back to SQLite for dev only) |
| `REDIS_URL` | Queues, rate limits, socket adapter, cache |
| `JWT_SECRET` | ≥32 chars — startup fails fast if weak/missing |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments in + verified webhooks |
| `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE` | Tier subscription price IDs |
| `VITE_FIREBASE_*` (6 vars) | Client auth/Firestore — no hardcoded fallback exists |
| `GOOGLE_APPLICATION_CREDENTIALS` | Server-side Firebase Admin + Firestore product writes |
| `GCS_BUCKET` | Media, mastered audio, AutoPilot product images |
| `GEMINI_API_KEY` | AI Studio, aijobs, AutoPilot |
| `PUBLIC_BASE_URL` | Absolute links in AutoPilot posts + share drafts |
| `ENABLE_AUTOPILOT` | **Default OFF** — see §4 before enabling |
| `AUTOPILOT_RUNS_PER_HOUR` | Default 10 (= every 6 minutes) |

## 2. Payment processing — both directions (verified present)
**Money IN (platform):** `/api/payments/create-subscription-session` (tier packages),
`/api/payments/create-checkout-session` (one-time), `/api/payments/webhook`
(signature-verified). **Money IN (clients/creators):** `/api/billing/checkout`
(marketplace sales), `/api/billing/booking/checkout` (event bookings),
`/api/billing/connect` (Stripe Connect onboarding so creators can receive funds).
**Money OUT (clients):** `/api/payouts/request` → double-entry ledger →
eligibility gates (60-day rule / Pro instant) — covered by 31 finance tests.

## 3. Routing (finalized)
- `/` → landing for signed-out visitors only; signed-in users redirect to `/dashboard`
- `/terms`, `/privacy`, `/policy` → live legal surface (required by Stripe/app review)
- `/marketplace` + `/marketplace/:productId` → real product data, OG/Twitter share
  cards, share menu covering the 10 largest platforms
- `*` catch-all → `/` (which itself routes by auth state)
- Web + mobile: responsive Tailwind UI + PWA manifest (installable). No native
  binary — that remains a separate future project.

## 4. V12 AutoPilot (new)
Autonomous generator: every cycle produces a real, saleable AI-generated digital
product (6 rotating templates), lists it in the marketplace under the official
`V12 AutoPilot` seller, auto-posts a promo to the INTERNAL ecosystem feed, and
queues ready-to-publish drafts for the 10 largest external platforms
(`social_post_drafts` table, with per-platform pacing notes).

**Before enabling:** at 10 cycles/hour this makes ~480 real Gemini calls/day
(text + image) — a deliberate cost decision. Set `ENABLE_AUTOPILOT=true` on the
scheduler service only.

**External posting is drafts-by-design, not a limitation we hid:** every major
platform requires per-account OAuth through an approved developer app (Meta App
Review, TikTok audit, X pay-per-use), and identical content fired in rapid bursts
across platforms trips spam detection even on sanctioned APIs. Internal feed =
full cadence; external = paced drafts until per-platform connectors are approved.

## 5. Global purchase & service guidelines
- Explicit consent at signup links the actual `/terms` and `/privacy` documents
- Policy Center (`/policy`) covers AML/KYC, international compliance, acceptable use
- Every sale: Stripe-verified webhooks, fraud screening, verified-seller identity
- Moderation gate: uploads pass review before going live; DMCA portal for rights holders

## 6. Verification state at packaging
- 88/88 automated tests across finance, identity, music, events, and AutoPilot
- CI blocks deploys on any test failure; shadow-file guard active
- Full production build (client + server + worker) passing
- CSP enabled; JWT hardened; no known fabricated endpoints remaining

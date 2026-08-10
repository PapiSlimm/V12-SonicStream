# SonicStream Stabilization — Checklist

Companion to `stabilize-sonicstream.ps1`. Run the script first; it handles
everything scriptable. These are the parts that need your hands (web consoles)
and the verification pass at the end.

## Before you run the script

- [ ] Install/verify gcloud CLI: `gcloud auth login` works
- [ ] Have a Stripe account, Dashboard open, **toggled to Test mode** (top-right)
- [ ] Run: `powershell -ExecutionPolicy Bypass -File stabilize-sonicstream.ps1`

## Manual: Google sign-in (5 min, console only — code is already built)

1. https://console.firebase.google.com → project **gen-lang-client-0237733980**
2. Build → **Authentication** → Sign-in method
3. Enable **Google** (set support email) — also confirm **Email/Password** is enabled
4. Authentication → Settings → **Authorized domains** → make sure the app's
   real domain(s) are listed: the `*.run.app` URL of sonicstream-server, plus
   `sonicstream.v12multimedia.com` if/when that domain is mapped
5. Test: open the app → Sign in → "Continue with Google"

## Manual: domain (only if Step 0 showed NO DNS)

The app is fully usable at the run.app URL. To put it on
`sonicstream.v12multimedia.com` later:

1. Own `v12multimedia.com` at a registrar (if not yet registered)
2. `gcloud beta run domain-mappings create --service sonicstream-server --domain sonicstream.v12multimedia.com --region us-east1`
3. Add the DNS records it prints at your registrar
4. Then update `CORS_ALLOWED_ORIGINS` env var on sonicstream-server to include it,
   and add the domain in Firebase Authorized domains (above)

## Verification (after script + Google sign-in)

- [ ] `<server-url>/health/live` returns OK (script step 6 does this)
- [ ] Sign in with Google works in the browser
- [ ] Test checkout: subscribe to Pro using Stripe test card `4242 4242 4242 4242`,
      any future expiry, any CVC
- [ ] Stripe Dashboard → Webhooks → your endpoint shows the event **delivered (200)**
- [ ] User's Pro status flips in the app after checkout completes
- [ ] Logs clean: `gcloud run services logs read sonicstream-server --region=us-east1 --limit=30`

## When test mode is proven → go live (10 min, same steps)

1. Stripe Dashboard → toggle **Live mode** → copy `sk_live_...` key
2. Recreate the two Products/Prices in live mode (test-mode products don't carry over)
3. Add a live-mode webhook endpoint (same URL) → new `whsec_...`
4. Re-run script steps 1–2 pasting the live values, then step 5 to roll revisions

## Ecosystem status (for the next session)

- SonicStream's side of the V12 bus is **built, tested (23 tests), and mounted**
  at `/api/ecosystem` (ping + SSO handoff, audience-isolated service tokens)
- It stays dormant (503) until `ECOSYSTEM_SECRET` is set — script step 4/5 does that
- When V12 core deploys: give it the **same** `ECOSYSTEM_SECRET`, copy
  `ecosystem/bus.ts` into it verbatim, and set SonicStream's `V12_PEERS`
  env var to `v12-core=<v12 core URL>`
- Rollback note: `deploy-sonicstream.cmd` now includes the ecosystem secret in
  its SECRETS list — run stabilization step 4 (creates the secret) before ever
  redeploying with that script, or the deploy will fail on the missing secret

## Also done this session (no action needed)

- Fixed `DEPLOY_RUNBOOK.md`: Stripe webhooks must point at `/api/webhooks/stripe`
  (the runbook previously said `/api/payments/webhook`, which can't verify signatures)
- `server/config.ts`: fail-closed guard — production boot refuses V12_PEERS
  without an ECOSYSTEM_SECRET

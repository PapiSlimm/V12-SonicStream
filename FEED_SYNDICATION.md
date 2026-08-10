# V12 Feed Syndication — SonicStream → Sociofy · CEOS · Orion Prime · Apex Atlas

**Wired 2026-08-10.** One action in SonicStream (track approved, media post
created, sale completed) fans out automatically as signed contract envelopes
(V12-Signature, contract v1.0) to every configured peer's feed/marketplace.
Wire protocol verified by 12 roundtrip tests (signing, dedupe, replay window,
spoof rejection, fail-closed).

## Who receives what

| App | Endpoint | What happens on receipt |
|---|---|---|
| **Sociofy** | `POST /api/ecosystem/events` (native receiver) | `content.track.available` / `content.media.published` become real feed posts authored by the linked Sociofy account (skipped with a log when the artist has no linked account) |
| **CEOS** | `POST /api/ecosystem/webhooks/sonicstream` (native receiver) | Tracks/media become Creator Economy Feed posts — licensable tracks land in category **V12 Marketplace**, the rest in **V12 Multimedia** |
| **Orion Prime** | `POST /api/ecosystem/feed/events` (new drop-in intake) | Events queue in `ecosystem-inbox.jsonl` + `GET /api/ecosystem/feed/inbox` as evidence for City World review |
| **Apex Atlas** | `POST /api/ecosystem/feed/events` (new drop-in intake) | Same — Apex's admission-review queue for the Atlas Galaxy |

## Automatic triggers (SonicStream event bus)

- `track.approved` → `content.track.available` (needs a public `streamUrl` — skipped with a log otherwise)
- `post.created` (with public media URL) → `content.media.published`
- `sale.completed` → `telemetry.activity`

Manual fan-out (admin): `POST /api/ecosystem/broadcast` `{ type, payload, rationale? }`
Destinations check (admin): `GET /api/ecosystem/feeds`

## Configuration

**SonicStream** (`.env` / Secret Manager):
```
V12_FEED_PEERS=sociofy=<url>,ceos=<url>,orion-prime=<url>,apexatlas=<url>
V12_WEBHOOK_SECRET=<openssl rand -hex 64>     # shared, or per-pair V12_<PEER>_WEBHOOK_SECRET
```

**Each receiving app** needs the matching secret in its env:
- Sociofy: signing key for the `sonicstream` peer in its peer registry (bootstrap/ecosystem.ts) — `V12_SONICSTREAM_WEBHOOK_SECRET`
- CEOS: `V12_SONICSTREAM_WEBHOOK_SECRET` (its `webhookSecretFor("sonicstream")`)
- Orion / Apex: `V12_SONICSTREAM_WEBHOOK_SECRET` or `V12_WEBHOOK_SECRET` or `ECOSYSTEM_SECRET`

**Simplest deployment:** set ONE shared `V12_WEBHOOK_SECRET` (or `ECOSYSTEM_SECRET`)
to the same value in all five apps. Per-pair keys can replace it later without
code changes.

No configured secret = nothing is sent and nothing is accepted. Unsigned
traffic is refused at every boundary — never disabled, never bypassed.

## Constitution alignment

- Destinations are reached only because a human configured them (`V12_FEED_PEERS`) — per-destination clearance in the spirit of §13.12
- Publishing refuses to dispatch while the ecosystem is halted (Art. X)
- Every dispatch logs its plain-language rationale before sending (Art. V)
- Delivery is at-least-once with dedupe on envelope id at every receiver — a retry never double-posts

## Testing a connection end-to-end (once two apps are running)

1. Set the shared secret in both apps, set `V12_FEED_PEERS` on SonicStream
2. As a SonicStream admin: `POST /api/ecosystem/broadcast` with
   `{"type":"content.track.available","payload":{"trackId":"t1","artistEcosystemUserId":"<user>","title":"Test Drop","durationSeconds":180,"streamUrl":"https://<sonicstream>/t/t1","licensable":true,"licensePriceCents":499}}`
3. Check the response's `dispatched` array for per-peer ok/status
4. Verify: Sociofy feed post / CEOS Creator Feed ("V12 Marketplace" category) /
   Orion & Apex `GET /api/ecosystem/feed/inbox`

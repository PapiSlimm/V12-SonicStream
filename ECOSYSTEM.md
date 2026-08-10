# V12 Ecosystem Bus

Every app in the Urban Visions ecosystem (V12 core, SonicStream, and future
apps: Headless Financial, CEOS, One Click Page) speaks the same interconnect
protocol, implemented in `ecosystem/bus.ts` (copy the file verbatim into each
new app).

## Rules (non-negotiable)

1. **Service tokens only.** Apps authenticate to each other with short-lived
   HMAC-signed tokens — never raw secrets on the wire, never open endpoints.
2. **Audience isolation.** A token minted for one app is REJECTED by every
   other app (`WRONG_AUDIENCE`). An agent or worker inside one app cannot
   replay its credentials against another. Proven by tests and live.
3. **Scopes.** `ping` = connectivity only. Private data moves only under an
   explicit scope (`user:handoff`, `data:read`, ...). No scope, no data.
4. **Protect each other from the outside, not from each other's rules.**
   Tokenless and forged calls are rejected before any handler runs.

## Endpoints (same shape in every app)

- `POST /api/ecosystem/ping` — connectivity handshake (scope: `ping`)
- `POST /api/ecosystem/handoff` — inbound SSO: creates/finds the user by email
  and issues a local session (scope: `user:handoff`)
- V12 core additionally exposes authenticated user routes:
  `GET /api/ecosystem/peers`, `POST /api/ecosystem/peers/:id/ping`,
  `POST /api/ecosystem/launch/:id` (one-click SSO into a peer app)

## Configuration

```
APP_ID=sonicstream                 # this app's identity on the bus
ECOSYSTEM_SECRET=<openssl rand -hex 64>   # same value across all ecosystem apps
V12_PEERS=v12-core=https://v12multimedia.com
```

In production, configuring peers without an ECOSYSTEM_SECRET is a boot error
(fail-closed). Rotate the secret by deploying the new value to all apps.

## Adding a future app (Headless Financial, CEOS, One Click Page)

1. Copy `ecosystem/bus.ts` in, mount `/api/ecosystem` routes.
2. Give it an `APP_ID`, the shared `ECOSYSTEM_SECRET`, and list its peers.
3. Its tokens only work where they're audienced — isolation is automatic.

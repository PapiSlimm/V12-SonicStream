/**
 * V12 ECOSYSTEM ROUTES — SonicStream's side of the interconnect bus.
 *
 * Endpoints (same shape in every ecosystem app — see ECOSYSTEM.md):
 *   POST /api/ecosystem/ping     — connectivity handshake (scope: "ping")
 *   POST /api/ecosystem/handoff  — inbound SSO: find/create the user by email
 *                                  and issue a local session (scope: "user:handoff")
 *   GET  /api/ecosystem/peers          — (admin) list configured peers
 *   POST /api/ecosystem/peers/:id/ping — (admin) outbound connectivity test
 *
 * This file is dependency-injected so it can be tested in isolation; the
 * wired-up router (config + db + jwt) lives in ecosystem.ts.
 *
 * Fail-closed: if ECOSYSTEM_SECRET is not configured, every endpoint returns
 * 503 ECOSYSTEM_DISABLED. No secret, no bus.
 */
import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import {
  verifyServiceToken,
  callPeer,
  EcosystemAuthError,
  ServiceClaims,
} from '../../ecosystem/bus.js';

export interface EcosystemUser {
  id: string;
  email: string;
  name?: string;
}

export interface EcosystemDeps {
  /** Shared HMAC secret. undefined/empty = bus disabled (503 on all routes). */
  secret: string | undefined;
  /** This app's identity on the bus, e.g. "sonicstream". */
  appId: string;
  /** Configured peers: id -> base URL. */
  peers: Record<string, string>;
  /** Look up an existing user by email (case-insensitive match recommended). */
  findUserByEmail(email: string): Promise<EcosystemUser | undefined>;
  /** Create a user record; called only when findUserByEmail misses. */
  createUser(user: { id: string; email: string; name: string }): Promise<void>;
  /** Issue a local session token for the handed-off user. */
  issueSession(user: { id: string; email: string }): string;
  /** Guard for the admin-only outbound routes (peers list / peer ping). */
  adminGuard: RequestHandler;
  /** Injectable fetch for outbound peer calls (tests). */
  fetchImpl?: typeof fetch;
}

export const TOKEN_HEADER = 'x-v12-service-token';

/** Deterministic local id for a handed-off user (stable across handoffs). */
export function handoffUserId(email: string): string {
  // Simple FNV-1a over the normalized email — no crypto import needed here,
  // collision risk is negligible at ecosystem scale and ids are namespaced.
  const s = email.trim().toLowerCase();
  let h1 = 0x811c9dc5, h2 = 0xcbf29ce4;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ s.charCodeAt(s.length - 1 - i), 0x01000193) >>> 0;
  }
  return `eco:${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

const AUTH_ERROR_STATUS: Record<EcosystemAuthError['code'], number> = {
  MALFORMED: 401,
  BAD_SIGNATURE: 401,
  EXPIRED: 401,
  WRONG_AUDIENCE: 403,
  MISSING_SCOPE: 403,
};

export function createEcosystemRouter(deps: EcosystemDeps): Router {
  const router = Router();
  router.use(express.json({ limit: '64kb' }));

  // Fail-closed: no secret, no bus.
  router.use((_req: Request, res: Response, next: NextFunction) => {
    if (!deps.secret || deps.secret.length < 32) {
      return res.status(503).json({
        error: 'Ecosystem bus is not configured on this deployment',
        code: 'ECOSYSTEM_DISABLED',
      });
    }
    next();
  });

  /** Verify the inbound service token for a required scope. */
  function requireServiceToken(scope: string) {
    return (req: Request & { serviceClaims?: ServiceClaims }, res: Response, next: NextFunction) => {
      const token = req.headers[TOKEN_HEADER];
      if (typeof token !== 'string' || !token) {
        return res.status(401).json({ error: 'Missing service token', code: 'NO_TOKEN' });
      }
      try {
        req.serviceClaims = verifyServiceToken(deps.secret!, token, { aud: deps.appId, scope });
        next();
      } catch (err) {
        if (err instanceof EcosystemAuthError) {
          return res.status(AUTH_ERROR_STATUS[err.code] ?? 401).json({ error: err.message, code: err.code });
        }
        return res.status(401).json({ error: 'Service token rejected', code: 'REJECTED' });
      }
    };
  }

  // ── Inbound ────────────────────────────────────────────────────────────────

  router.post('/ping', requireServiceToken('ping'), (req: Request & { serviceClaims?: ServiceClaims }, res: Response) => {
    res.json({ ok: true, app: deps.appId, from: req.serviceClaims!.iss, ts: Date.now() });
  });

  router.post(
    '/handoff',
    requireServiceToken('user:handoff'),
    async (req: Request & { serviceClaims?: ServiceClaims }, res: Response) => {
      const claims = req.serviceClaims!;
      const profile = (claims.data ?? {}) as { email?: unknown; name?: unknown };
      const email = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Handoff token carries no valid email', code: 'BAD_PROFILE' });
      }
      const name = typeof profile.name === 'string' && profile.name.trim()
        ? profile.name.trim().slice(0, 120)
        : email.split('@')[0];

      try {
        let user = await deps.findUserByEmail(email);
        if (!user) {
          const id = handoffUserId(email);
          await deps.createUser({ id, email, name });
          user = { id, email, name };
        }
        const token = deps.issueSession({ id: user.id, email: user.email });
        res.json({ ok: true, app: deps.appId, from: claims.iss, token, user: { id: user.id, email: user.email } });
      } catch (err) {
        console.error('[ecosystem] handoff failed:', err);
        res.status(500).json({ error: 'Handoff failed', code: 'HANDOFF_ERROR' });
      }
    },
  );

  // ── Outbound (admin only) ──────────────────────────────────────────────────

  router.get('/peers', deps.adminGuard, (_req: Request, res: Response) => {
    res.json({
      app: deps.appId,
      peers: Object.entries(deps.peers).map(([id, url]) => ({ id, url })),
    });
  });

  router.post('/peers/:id/ping', deps.adminGuard, async (req: Request, res: Response) => {
    const peerId = String(req.params.id);
    const baseUrl = deps.peers[peerId];
    if (!baseUrl) {
      return res.status(404).json({ error: `Unknown peer "${peerId}"`, code: 'UNKNOWN_PEER' });
    }
    try {
      const result = await callPeer({
        secret: deps.secret!,
        selfId: deps.appId,
        peerId,
        peerBaseUrl: baseUrl,
        path: '/api/ecosystem/ping',
        scope: ['ping'],
        fetchImpl: deps.fetchImpl,
      });
      res.status(result.status === 200 ? 200 : 502).json({
        peer: peerId,
        reachable: result.status === 200,
        status: result.status,
        body: result.body,
      });
    } catch (err) {
      res.status(502).json({
        peer: peerId,
        reachable: false,
        error: err instanceof Error ? err.message : String(err),
        code: 'PEER_UNREACHABLE',
      });
    }
  });

  return router;
}

/** Parse V12_PEERS ("name=url,name2=url2") into a peer map. */
export function parsePeers(raw: string | undefined): Record<string, string> {
  const peers: Record<string, string> = {};
  for (const pair of (raw ?? '').split(',')) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const id = trimmed.slice(0, eq).trim();
    const url = trimmed.slice(eq + 1).trim();
    if (id && /^https?:\/\//.test(url)) peers[id] = url.replace(/\/$/, '');
  }
  return peers;
}

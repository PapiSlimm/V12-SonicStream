/**
 * Ecosystem bus + routes tests. Everything runs against a real express server
 * on an ephemeral port with injected dependencies — no database, no network.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { signServiceToken, verifyServiceToken, EcosystemAuthError } from '../../../ecosystem/bus.js';
import { createEcosystemRouter, parsePeers, handoffUserId, TOKEN_HEADER } from '../ecosystem.core.js';

const SECRET = 'a'.repeat(64);

describe('ecosystem bus primitives', () => {
  const token = signServiceToken(SECRET, { iss: 'v12-core', aud: 'sonicstream', scope: ['ping'] });

  it('roundtrips sign/verify', () => {
    expect(verifyServiceToken(SECRET, token, { aud: 'sonicstream', scope: 'ping' }).iss).toBe('v12-core');
  });

  it('enforces audience isolation (cross-app replay refused)', () => {
    expect(() => verifyServiceToken(SECRET, token, { aud: 'headless-financial' }))
      .toThrowError(/Cross-app replay refused/);
  });

  it('enforces scopes', () => {
    try {
      verifyServiceToken(SECRET, token, { aud: 'sonicstream', scope: 'user:handoff' });
      expect.unreachable();
    } catch (e) {
      expect((e as EcosystemAuthError).code).toBe('MISSING_SCOPE');
    }
  });

  it('rejects expired tokens', () => {
    const old = signServiceToken(SECRET, { iss: 'x', aud: 'sonicstream', scope: ['ping'] },
      { now: Math.floor(Date.now() / 1000) - 3600 });
    try {
      verifyServiceToken(SECRET, old, { aud: 'sonicstream' });
      expect.unreachable();
    } catch (e) {
      expect((e as EcosystemAuthError).code).toBe('EXPIRED');
    }
  });

  it('rejects tampered signatures and wrong secrets', () => {
    const [h, b, sig] = token.split('.');
    expect(() => verifyServiceToken(SECRET, `${h}.${b}.AAAA${sig.slice(4)}`, { aud: 'sonicstream' })).toThrow();
    expect(() => verifyServiceToken('b'.repeat(64), token, { aud: 'sonicstream' })).toThrow();
  });
});

describe('helpers', () => {
  it('parsePeers parses pairs and strips trailing slashes', () => {
    const p = parsePeers('v12-core=https://v12multimedia.com/, ceos=https://ceos.example.com');
    expect(p).toEqual({ 'v12-core': 'https://v12multimedia.com', ceos: 'https://ceos.example.com' });
  });

  it('parsePeers is empty-safe and rejects malformed entries', () => {
    expect(parsePeers(undefined)).toEqual({});
    expect(parsePeers('bad,=x,noproto=ftp://x')).toEqual({});
  });

  it('handoffUserId is normalized and stable', () => {
    expect(handoffUserId('A@B.com')).toBe(handoffUserId(' a@b.com'));
    expect(handoffUserId('a@b.com')).not.toBe(handoffUserId('a@c.com'));
  });
});

describe('ecosystem routes', () => {
  const users = new Map<string, { id: string; email: string; name: string }>();
  let server: Server;
  let base: string;
  let adminOk = false;

  beforeAll(() => {
    const app = express();
    app.use('/api/ecosystem', createEcosystemRouter({
      secret: SECRET,
      appId: 'sonicstream',
      peers: { 'v12-core': 'https://v12multimedia.com' },
      findUserByEmail: async (e) => users.get(e),
      createUser: async (u) => { users.set(u.email, u); },
      issueSession: (u) => `session-for-${u.id}`,
      adminGuard: (_req, res, next) => (adminOk ? next() : res.status(403).json({ error: 'admin only' })),
      fetchImpl: (async (url: unknown) => ({
        status: 200,
        json: async () => ({ ok: true, app: 'v12-core', echoUrl: String(url) }),
      })) as unknown as typeof fetch,
    }));

    // A second app on the same server to prove fail-closed behavior
    app.use('/disabled/ecosystem', createEcosystemRouter({
      secret: undefined,
      appId: 'sonicstream',
      peers: {},
      findUserByEmail: async () => undefined,
      createUser: async () => {},
      issueSession: () => '',
      adminGuard: (_req, _res, next) => next(),
    }));

    server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => { server.close(); });

  it('fails closed with 503 when no secret is configured', async () => {
    const r = await fetch(`${base}/disabled/ecosystem/ping`, { method: 'POST' });
    expect(r.status).toBe(503);
    expect((await r.json()).code).toBe('ECOSYSTEM_DISABLED');
  });

  it('rejects tokenless pings', async () => {
    const r = await fetch(`${base}/api/ecosystem/ping`, { method: 'POST' });
    expect(r.status).toBe(401);
  });

  it('accepts a valid ping', async () => {
    const t = signServiceToken(SECRET, { iss: 'v12-core', aud: 'sonicstream', scope: ['ping'] });
    const r = await fetch(`${base}/api/ecosystem/ping`, { method: 'POST', headers: { [TOKEN_HEADER]: t } });
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body).toMatchObject({ ok: true, app: 'sonicstream', from: 'v12-core' });
  });

  it('refuses a token minted for another app', async () => {
    const t = signServiceToken(SECRET, { iss: 'v12-core', aud: 'ceos', scope: ['ping'] });
    const r = await fetch(`${base}/api/ecosystem/ping`, { method: 'POST', headers: { [TOKEN_HEADER]: t } });
    expect(r.status).toBe(403);
    expect((await r.json()).code).toBe('WRONG_AUDIENCE');
  });

  it('refuses handoff without the user:handoff scope', async () => {
    const t = signServiceToken(SECRET, { iss: 'v12-core', aud: 'sonicstream', scope: ['ping'] });
    const r = await fetch(`${base}/api/ecosystem/handoff`, { method: 'POST', headers: { [TOKEN_HEADER]: t } });
    expect(r.status).toBe(403);
    expect((await r.json()).code).toBe('MISSING_SCOPE');
  });

  it('creates a user and issues a session on first handoff, reuses on repeat', async () => {
    const t1 = signServiceToken(SECRET, {
      iss: 'v12-core', aud: 'sonicstream', scope: ['user:handoff'],
      data: { email: 'Papi@V12.com', name: 'Papi' },
    });
    const r1 = await fetch(`${base}/api/ecosystem/handoff`, { method: 'POST', headers: { [TOKEN_HEADER]: t1 } });
    const h1 = await r1.json();
    expect(r1.status).toBe(200);
    expect(h1.user.email).toBe('papi@v12.com');
    expect(h1.token).toBe(`session-for-${h1.user.id}`);

    const t2 = signServiceToken(SECRET, {
      iss: 'v12-core', aud: 'sonicstream', scope: ['user:handoff'],
      data: { email: 'papi@v12.com' },
    });
    const r2 = await fetch(`${base}/api/ecosystem/handoff`, { method: 'POST', headers: { [TOKEN_HEADER]: t2 } });
    const h2 = await r2.json();
    expect(h2.user.id).toBe(h1.user.id);
    expect(users.size).toBe(1);
  });

  it('rejects a handoff token with no valid email', async () => {
    const t = signServiceToken(SECRET, {
      iss: 'v12-core', aud: 'sonicstream', scope: ['user:handoff'], data: { email: 'not-an-email' },
    });
    const r = await fetch(`${base}/api/ecosystem/handoff`, { method: 'POST', headers: { [TOKEN_HEADER]: t } });
    expect(r.status).toBe(400);
  });

  it('guards outbound routes behind admin', async () => {
    adminOk = false;
    expect((await fetch(`${base}/api/ecosystem/peers`)).status).toBe(403);

    adminOk = true;
    const list = await (await fetch(`${base}/api/ecosystem/peers`)).json();
    expect(list.peers).toEqual([{ id: 'v12-core', url: 'https://v12multimedia.com' }]);

    const ping = await fetch(`${base}/api/ecosystem/peers/v12-core/ping`, { method: 'POST' });
    const pr = await ping.json();
    expect(ping.status).toBe(200);
    expect(pr.reachable).toBe(true);
    expect(pr.body.echoUrl).toBe('https://v12multimedia.com/api/ecosystem/ping');

    expect((await fetch(`${base}/api/ecosystem/peers/nope/ping`, { method: 'POST' })).status).toBe(404);
  });
});

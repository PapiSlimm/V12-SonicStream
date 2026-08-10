import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../firebase-admin.js', () => ({
  auth: { verifyIdToken: vi.fn() },
}));

vi.mock('../../../db.js', () => ({
  get: vi.fn(),
  run: vi.fn(),
}));

vi.mock('../jwt.service.js', () => ({
  JWTService: { verifyToken: vi.fn() },
}));

import { auth as firebaseAuth } from '../../../firebase-admin.js';
import { get, run } from '../../../db.js';
import { JWTService } from '../jwt.service.js';
import {
  authenticateToken,
  authenticateAdmin,
  requirePermission,
  requireArtist,
  requirePro,
  getRBACDetails,
  AuthRequest,
} from '../auth.js';

const mockVerifyIdToken = firebaseAuth.verifyIdToken as ReturnType<typeof vi.fn>;
const mockGet = get as ReturnType<typeof vi.fn>;
const mockRun = run as ReturnType<typeof vi.fn>;
const mockJwtVerify = JWTService.verifyToken as ReturnType<typeof vi.fn>;

// A Firebase-style token: must exceed the 50-char routing threshold in auth.ts
const LONG_TOKEN = 'f'.repeat(120);
const SHORT_TOKEN = 'api-key-token'; // <= 50 chars routes to JWTService

function makeReq(token?: string): AuthRequest {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as unknown as AuthRequest;
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  mockVerifyIdToken.mockReset();
  mockGet.mockReset();
  mockRun.mockReset();
  mockJwtVerify.mockReset();
  vi.unstubAllGlobals();
});

// =====================================================================
// getRBACDetails - the permission map every request flows through
// =====================================================================
describe('getRBACDetails', () => {
  it('grants admins the full role chain and admin-only permissions', () => {
    const { roles, permissions } = getRBACDetails('admin');
    expect(roles).toEqual(['admin', 'artist', 'listener']);
    expect(permissions).toContain('admin_manage');
    expect(permissions).toContain('payout_approve');
  });

  it('grants artists payout_request but never payout_approve', () => {
    const { roles, permissions } = getRBACDetails('artist');
    expect(roles).toEqual(['artist', 'listener']);
    expect(permissions).toContain('payout_request');
    expect(permissions).not.toContain('payout_approve');
    expect(permissions).not.toContain('admin_manage');
  });

  it('defaults unknown and missing userTypes to listener with minimal permissions', () => {
    for (const t of [undefined, 'listener', 'something-weird']) {
      const { roles, permissions } = getRBACDetails(t);
      expect(roles).toEqual(['listener']);
      expect(permissions).not.toContain('payout_request');
      expect(permissions).not.toContain('admin_manage');
    }
  });

  it('is case-insensitive on userType', () => {
    expect(getRBACDetails('ADMIN').roles).toContain('admin');
    expect(getRBACDetails('Artist').roles).toContain('artist');
  });
});

// =====================================================================
// authenticateToken - routing, sync, and failure modes
// =====================================================================
describe('authenticateToken', () => {
  it('401s when there is no Authorization header at all', async () => {
    const res = makeRes();
    const next = vi.fn();
    await authenticateToken(makeReq(), res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('verifies a long token via Firebase, loads the user, and attaches RBAC details', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: 'fb-user-1', email: 'a@b.com' });
    mockGet.mockResolvedValueOnce({ id: 'fb-user-1', userType: 'artist', tenantId: 't1' });

    const req = makeReq(LONG_TOKEN);
    const res = makeRes();
    const next = vi.fn();
    await authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({
      id: 'fb-user-1',
      email: 'a@b.com',
      userType: 'artist',
      tenantId: 't1',
    });
    expect(req.user!.permissions).toContain('payout_request');
    expect(mockRun).not.toHaveBeenCalled(); // existing user: no insert
  });

  it('auto-creates a local user row on first login (Firebase user not yet in DB)', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: 'brand-new', email: 'new@x.com' });
    mockGet
      .mockResolvedValueOnce(undefined) // first lookup: not found
      .mockResolvedValueOnce({ id: 'brand-new', userType: 'listener' }); // post-insert lookup
    mockRun.mockResolvedValueOnce({});

    const req = makeReq(LONG_TOKEN);
    const next = vi.fn();
    await authenticateToken(req, makeRes(), next);

    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      ['brand-new', 'new@x.com', expect.stringContaining('User '), 'listener']
    );
    expect(next).toHaveBeenCalled();
    expect(req.user!.roles).toEqual(['listener']);
  });

  it('falls back to Google tokeninfo when Firebase rejects a long token', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('not a firebase token'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sub: 'g-123', email: 'g@gmail.com' }),
    }));
    mockGet.mockResolvedValueOnce({ id: 'google:g-123', userType: 'listener' });

    const req = makeReq(LONG_TOKEN);
    const next = vi.fn();
    await authenticateToken(req, makeRes(), next);

    expect(next).toHaveBeenCalled();
    expect(req.user!.id).toBe('google:g-123');
  });

  it('403s when both Firebase and the Google fallback reject the token', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('bad token'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false }));

    const res = makeRes();
    const next = vi.fn();
    await authenticateToken(makeReq(LONG_TOKEN), res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('routes google:-prefixed tokens straight to Google tokeninfo', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sub: 'sub-9', email: 'oauth@gmail.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    mockGet.mockResolvedValueOnce({ id: 'google:sub-9', userType: 'listener' });

    const req = makeReq('google:raw-oauth-token');
    const next = vi.fn();
    await authenticateToken(req, makeRes(), next);

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('tokeninfo?id_token=raw-oauth-token'));
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
    expect(req.user!.id).toBe('google:sub-9');
  });

  it('routes spotify:-prefixed tokens to the Spotify API with a Bearer header', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'sp-artist', email: 'sp@x.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    mockGet.mockResolvedValueOnce({ id: 'spotify:sp-artist', userType: 'artist' });

    const req = makeReq('spotify:sp-access-token');
    const next = vi.fn();
    await authenticateToken(req, makeRes(), next);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me',
      expect.objectContaining({ headers: { Authorization: 'Bearer sp-access-token' } })
    );
    expect(req.user!.id).toBe('spotify:sp-artist');
    expect(req.user!.permissions).toContain('payout_request');
  });

  it('routes tokens of 50 chars or less to JWTService', async () => {
    mockJwtVerify.mockReturnValueOnce({ uid: 'svc-1', email: 'svc@v12.com', type: 'api_key' });
    mockGet.mockResolvedValueOnce({ id: 'svc-1', userType: 'listener' });

    const req = makeReq(SHORT_TOKEN);
    const next = vi.fn();
    await authenticateToken(req, makeRes(), next);

    expect(mockJwtVerify).toHaveBeenCalledWith(SHORT_TOKEN);
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
    expect(req.user!.id).toBe('svc-1');
  });

  it('403s (never 500s) when the JWT branch throws', async () => {
    mockJwtVerify.mockImplementationOnce(() => { throw new Error('jwt malformed'); });

    const res = makeRes();
    const next = vi.fn();
    await authenticateToken(makeReq(SHORT_TOKEN), res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// =====================================================================
// Route guards
// =====================================================================
describe('requirePermission', () => {
  it('403s with a named permission error when the permission is missing', () => {
    const req = { user: { permissions: ['view_dashboard'] } } as unknown as AuthRequest;
    const res = makeRes();
    const next = vi.fn();
    requirePermission('payout_approve')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('payout_approve') });
    expect(next).not.toHaveBeenCalled();
  });

  it('403s when req.user is absent entirely', () => {
    const res = makeRes();
    const next = vi.fn();
    requirePermission('view_dashboard')({} as AuthRequest, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('calls next when the permission is present', () => {
    const req = { user: { permissions: ['payout_approve'] } } as unknown as AuthRequest;
    const next = vi.fn();
    requirePermission('payout_approve')(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('requireArtist', () => {
  it('401s when unauthenticated', async () => {
    const res = makeRes();
    await requireArtist({} as AuthRequest, res, vi.fn());
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });

  it('403s for a plain listener', async () => {
    mockGet.mockResolvedValueOnce({ userType: 'listener' });
    const res = makeRes();
    const next = vi.fn();
    await requireArtist({ user: { id: 'u1' } } as AuthRequest, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes artists and admins through', async () => {
    for (const t of ['artist', 'admin']) {
      mockGet.mockResolvedValueOnce({ userType: t });
      const next = vi.fn();
      await requireArtist({ user: { id: 'u1' } } as AuthRequest, makeRes(), next);
      expect(next).toHaveBeenCalled();
    }
  });
});

describe('requirePro', () => {
  it('403s for a non-pro user', async () => {
    mockGet.mockResolvedValueOnce({ isPro: 0 });
    const res = makeRes();
    await requirePro({ user: { id: 'u1' } } as AuthRequest, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('passes a pro user through', async () => {
    mockGet.mockResolvedValueOnce({ isPro: 1 });
    const next = vi.fn();
    await requirePro({ user: { id: 'u1' } } as AuthRequest, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('authenticateAdmin', () => {
  it('401s without a token', async () => {
    const res = makeRes();
    await authenticateAdmin(makeReq(), res, vi.fn());
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });

  it('403s a verified user who is not an admin - valid credentials are not enough', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: 'artist-1', email: 'a@x.com' });
    mockGet.mockResolvedValueOnce({ userType: 'artist' });

    const res = makeRes();
    const next = vi.fn();
    await authenticateAdmin(makeReq(LONG_TOKEN), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes a real admin through with full admin RBAC attached', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: 'admin-1', email: 'boss@v12.com' });
    mockGet.mockResolvedValueOnce({ userType: 'admin', tenantId: 'hq' });

    const req = makeReq(LONG_TOKEN);
    const next = vi.fn();
    await authenticateAdmin(req, makeRes(), next);

    expect(next).toHaveBeenCalled();
    expect(req.user!.permissions).toContain('admin_manage');
    expect(req.user!.roles).toEqual(['admin', 'artist', 'listener']);
  });

  it('403s on Firebase verification failure and never falls back to Google', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('expired'));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = makeRes();
    await authenticateAdmin(makeReq(LONG_TOKEN), res, vi.fn());

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    // Admin auth is intentionally stricter: Firebase-only, no OAuth fallback paths.
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

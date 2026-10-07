/**
 * Self-hosted auth (2026-10-07) — SONIC AUTH.
 *
 * WHY: the platform's login ran entirely on Firebase Auth (client SDK) with the
 * server only verifying Firebase ID tokens. The Firebase project lives in the
 * suspended GCP account, so Google returns 503 and every sign-in loops forever.
 * These routes make the platform's own server the identity provider:
 * email + password, scrypt-hashed (Node stdlib — no new dependency), signed
 * with the app's own JWT_SECRET. Works with the existing `users.password`
 * column and the JWT path already present in authenticateToken.
 */
import { Router } from 'express';
import crypto from 'crypto';
import { run, get } from '../../db.js';
import { AppError } from '../../middleware/error.js';
import { JWTService } from './jwt.service.js';
import { authenticateToken, AuthRequest } from './auth.js';

const router = Router();

/* ── password hashing (scrypt, stdlib) ─────────────────────────────────── */
const SCRYPT_N = 16384, SCRYPT_r = 8, SCRYPT_p = 1, KEYLEN = 64;

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p }, (err, dk) => {
      if (err) return reject(err);
      resolve(`scrypt$${SCRYPT_N}$${salt}$${dk.toString('hex')}`);
    });
  });
}

function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const [scheme, nStr, salt, hex] = String(stored).split('$');
      if (scheme !== 'scrypt' || !salt || !hex) return resolve(false);
      crypto.scrypt(password, salt, KEYLEN, { N: Number(nStr) || SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p }, (err, dk) => {
        if (err) return resolve(false);
        const a = Buffer.from(hex, 'hex');
        resolve(a.length === dk.length && crypto.timingSafeEqual(a, dk));
      });
    } catch { resolve(false); }
  });
}

const issueTokens = (uid: string, email: string) => ({
  token: JWTService.generateToken({ uid, email, type: 'access' }, '7d'),
  refreshToken: JWTService.generateToken({ uid, email, type: 'access' }, '30d'),
});

const publicUser = (u: any) => ({
  id: u.id, email: u.email, name: u.name, userType: u.userType,
  subscriptionTier: u.subscriptionTier, isPro: u.isPro,
  avatarUrl: u.avatarUrl ?? u.avatar_url ?? null,
});

/* ── POST /api/auth/register ───────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  const { email, password, name, userType } = req.body || {};
  const mail = String(email || '').trim().toLowerCase();
  if (!mail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) throw new AppError('A valid email is required', 400);
  if (!password || String(password).length < 8) throw new AppError('Password must be at least 8 characters', 400);

  const existing = await get<any>('SELECT id, password FROM users WHERE LOWER(email) = ?', [mail]);
  if (existing && existing.password) throw new AppError('An account with this email already exists — log in instead', 409);

  const hash = await hashPassword(String(password));
  const displayName = String(name || mail.split('@')[0]).slice(0, 80);
  const safeType = ['creator', 'artist', 'business', 'venue'].includes(userType) ? userType : 'creator';

  let uid: string;
  if (existing) {
    // Account pre-created by an old Firebase sync — claim it by setting a password.
    uid = existing.id;
    await run('UPDATE users SET password = ?, name = COALESCE(name, ?) WHERE id = ?', [hash, displayName, uid]);
  } else {
    uid = 'u_' + crypto.randomUUID().replace(/-/g, '');
    await run(
      `INSERT INTO users (id, email, name, password, user_type, is_pro, subscription_tier, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uid, mail, displayName, hash, safeType, false, 'free', true]
    );
  }
  const user = await get<any>('SELECT * FROM users WHERE id = ?', [uid]);
  res.status(201).json({ ...issueTokens(uid, mail), user: publicUser(user) });
});

/* ── POST /api/auth/login ──────────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const mail = String(email || '').trim().toLowerCase();
  if (!mail || !password) throw new AppError('Email and password are required', 400);

  const user = await get<any>('SELECT * FROM users WHERE LOWER(email) = ?', [mail]);
  if (!user || !user.password) throw new AppError('Invalid email or password', 401);
  const ok = await verifyPassword(String(password), user.password);
  if (!ok) throw new AppError('Invalid email or password', 401);

  res.json({ ...issueTokens(user.id, mail), user: publicUser(user) });
});

/* ── POST /api/auth/refresh ────────────────────────────────────────────── */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) throw new AppError('refreshToken required', 400);
  try {
    const payload = JWTService.verifyToken(String(refreshToken));
    res.json(issueTokens(payload.uid, payload.email));
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }
});

/* ── GET /api/auth/me ──────────────────────────────────────────────────── */
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  const user = await get<any>('SELECT * FROM users WHERE id = ?', [req.user?.id]);
  if (!user) throw new AppError('User not found', 404);
  res.json(publicUser(user));
});

export default router;

import { describe, it, expect, vi } from 'vitest';

// Pin the secret so tests are deterministic and don't depend on env/config side effects.
const TEST_SECRET = 'a'.repeat(48);
vi.mock('../../../config.js', () => ({
  config: { JWT_SECRET: 'a'.repeat(48) },
}));

import jwt from 'jsonwebtoken';
import { JWTService, JWTPayload } from '../jwt.service.js';

const payload: JWTPayload = { uid: 'user-123', email: 'artist@v12.com', type: 'access' };

describe('JWTService', () => {
  it('round-trips: verifyToken returns the payload generateToken signed', () => {
    const token = JWTService.generateToken(payload);
    const decoded = JWTService.verifyToken(token);

    expect(decoded.uid).toBe('user-123');
    expect(decoded.email).toBe('artist@v12.com');
    expect(decoded.type).toBe('access');
  });

  it('produces a standard three-segment JWT', () => {
    const token = JWTService.generateToken(payload);
    expect(token.split('.')).toHaveLength(3);
    // Documented quirk (see auth.ts): real JWTs are far longer than the 50-char
    // routing threshold in authenticateToken, so custom JWTs would be routed to the
    // Firebase branch, not this verifier. Locking that fact in as a test so anyone
    // wiring up JWTService issuance discovers the routing gap immediately.
    expect(token.length).toBeGreaterThan(50);
  });

  it('rejects a token whose signature does not match (tampered payload)', () => {
    const token = JWTService.generateToken(payload);
    const [header, , signature] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ uid: 'attacker', email: 'evil@x.com', type: 'access' })
    ).toString('base64url');
    const forged = `${header}.${forgedBody}.${signature}`;

    expect(() => JWTService.verifyToken(forged)).toThrow();
  });

  it('rejects a token signed with a different secret', () => {
    const foreign = jwt.sign(payload, 'some-other-secret-that-is-long-enough!!');
    expect(() => JWTService.verifyToken(foreign)).toThrow(/invalid signature/);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1s' });
    expect(() => JWTService.verifyToken(expired)).toThrow(/expired/);
  });

  it('honors a custom expiresIn on generation', () => {
    const token = JWTService.generateToken(payload, '1h');
    const decoded = jwt.decode(token) as { exp: number; iat: number };
    expect(decoded.exp - decoded.iat).toBe(3600);
  });
});

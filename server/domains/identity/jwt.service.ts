import jwt from 'jsonwebtoken';
import { config } from '../../config.js';

// config.JWT_SECRET is validated at startup (min 32 chars, random secure fallback in dev).
// Never add a hardcoded string fallback here: a literal in source would silently become
// the signing key for every token if the config guard ever regressed.
const JWT_SECRET = config.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is missing or too short - refusing to sign or verify tokens');
}

export interface JWTPayload {
  uid: string;
  email: string;
  type: 'access' | 'api_key';
}

export class JWTService {
  static generateToken(payload: JWTPayload, expiresIn: jwt.SignOptions['expiresIn'] = '24h'): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }
}

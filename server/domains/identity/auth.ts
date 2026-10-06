import { Request, Response, NextFunction } from 'express';
import { auth as firebaseAuth } from '../../firebase-admin.js';
import { get, run } from '../../db.js';
import { User } from '../../types.js';
import { JWTService } from './jwt.service.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType?: string;
    roles?: string[];
    permissions?: string[];
    tenantId?: string;
  };
}

// Map userTypes to roles and fine-grained permissions for RBAC
export function getRBACDetails(userType: string | undefined): { roles: string[]; permissions: string[] } {
  const normType = (userType || 'listener').toLowerCase();
  
  if (normType === 'admin') {
    return {
      roles: ['admin', 'artist', 'listener'],
      permissions: [
        'admin_manage',
        'payout_approve',
        'payout_reject',
        'manage_marketplace',
        'book_artist',
        'list_artist_availability',
        'create_event',
        'view_dashboard',
        'edit_profile',
        'use_ai_features'
      ]
    };
  }
  
  if (normType === 'artist') {
    return {
      roles: ['artist', 'listener'],
      permissions: [
        'payout_request',
        'list_artist_availability',
        'create_event',
        'view_dashboard',
        'edit_profile',
        'book_artist',
        'use_ai_features'
      ]
    };
  }
  
  // Default 'listener' / standard user
  return {
    roles: ['listener'],
    permissions: [
      'book_artist',
      'view_dashboard',
      'edit_profile'
    ]
  };
}

async function verifyGoogleToken(idToken: string): Promise<{ uid: string; email: string }> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!response.ok) {
    throw new Error('Invalid Google token');
  }
  const data = (await response.json()) as { sub: string; email?: string };
  if (!data.sub) {
    throw new Error('Google token contains no sub');
  }
  return { uid: `google:${data.sub}`, email: data.email || '' };
}

async function verifySpotifyToken(accessToken: string): Promise<{ uid: string; email: string }> {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Invalid Spotify token');
  }
  const data = (await response.json()) as { id: string; email?: string };
  if (!data.id) {
    throw new Error('Spotify token contains no id');
  }
  return { uid: `spotify:${data.id}`, email: data.email || '' };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    let decodedToken: { uid: string; email: string };

    // Support Google and Spotify OAuth2 token prefix or raw checks
    if (token.startsWith('google:')) {
      decodedToken = await verifyGoogleToken(token.slice(7));
    } else if (token.startsWith('spotify:')) {
      decodedToken = await verifySpotifyToken(token.slice(8));
    } else {
      // Strategy 1: Firebase Auth (Standard for Browser/Frontend)
      if (token.length > 50) { // Firebase tokens are usually long
         try {
           const firebaseUser = await firebaseAuth.verifyIdToken(token);
           decodedToken = { uid: firebaseUser.uid, email: firebaseUser.email || '' };
         } catch (fbErr) {
           // Fallback strategy: Test if it is a direct Google OAuth2 reference
           try {
             decodedToken = await verifyGoogleToken(token);
           } catch {
             throw fbErr; // Throw original Firebase verification error if Google direct check also fails
           }
         }
      } 
      // Strategy 2: Custom JWT (API Keys / Service tokens)
      else {
        const payload = JWTService.verifyToken(token);
        decodedToken = { uid: payload.uid, email: payload.email };
      }
    }
    
    // Auto-sync user to local DB if they don't exist
    let user = await get<User>('SELECT * FROM users WHERE id = ?', [decodedToken.uid]);
    if (!user) {
      await run(
        'INSERT INTO users (id, email, name, user_type) VALUES (?, ?, ?, ?)',
        [decodedToken.uid, decodedToken.email || '', 'User ' + decodedToken.uid.slice(0, 5), 'listener']
      );
      user = await get<User>('SELECT * FROM users WHERE id = ?', [decodedToken.uid]);
    }

    const { roles, permissions } = getRBACDetails(user?.userType);

    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      userType: user?.userType,
      roles,
      permissions,
      tenantId: user?.tenantId
    };
    next();
  } catch (error) {
    console.error('Authentication failed:', error);
    return res.sendStatus(403);
  }
};

export const requirePermission = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ error: `Forbidden: missing permission '${requiredPermission}'` });
    }
    next();
  };
};

export const requireArtist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.sendStatus(401);
  
  const user = await get<User>('SELECT user_type FROM users WHERE id = ?', [req.user.id]);
  if (user?.userType !== 'artist' && user?.userType !== 'admin') {
    return res.status(403).json({ error: 'Artist account required' });
  }
  next();
};

export const requirePro = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.sendStatus(401);
  const user = await get<User>('SELECT is_pro FROM users WHERE id = ?', [req.user.id]);
  if (!user?.isPro) {
    return res.status(403).json({ error: 'Premium subscription required for this feature' });
  }
  next();
};

export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const user = await get<User>('SELECT user_type FROM users WHERE id = ?', [decodedToken.uid]);
    if (user?.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { roles, permissions } = getRBACDetails(user?.userType);

    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      userType: user?.userType,
      roles,
      permissions,
      tenantId: user?.tenantId
    };
    next();
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return res.sendStatus(403);
  }
};


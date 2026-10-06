import { Request, Response, NextFunction } from 'express';
import { FEATURES, getFeatureLimits } from '../config/features.js';

export interface AuthenticatedReq extends Request {
  user?: any;
}

export function requireTier(feature: string) {
  return function(req: AuthenticatedReq, res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tier = user.subscription_tier || 'free';
    const allowedTiers = FEATURES[feature];
    
    if (!allowedTiers) {
      return res.status(500).json({ error: 'Feature not configured' });
    }
    
    if (!allowedTiers.includes(tier) && tier !== 'enterprise') {
      return res.status(403).json({ 
        error: `Feature requires ${allowedTiers.join(' or ')} tier`,
        current_tier: tier,
        upgrade_url: '/pricing'
      });
    }
    
    next();
  };
}

export function checkLimits(feature: 'tracks' | 'products' | 'followers' | 'events_per_month' | 'email_sends', user: any, currentUsage: number): boolean {
  const tier = user.subscription_tier || 'free';
  const limits = getFeatureLimits(tier);
  const limit = (limits as any)[feature];
  
  if (limit === -1 || limit === undefined) return true; // Unlimited
  return currentUsage < limit;
}

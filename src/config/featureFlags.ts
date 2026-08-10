import { FEATURES } from '../core/featureFlags';

export type FeatureKey = 
  | 'LIVE_STREAMING' 
  | 'BOOKINGS' 
  | 'AI_STUDIO' 
  | 'PLAYLISTS' 
  | 'ANALYTICS'
  | 'SMART_FEED'
  | 'SITE_BUILDER'
  | 'AFFILIATE'
  | 'VIDEO'
  | 'PLUGINS'
  | 'COLLAB';

export interface UserCapabilities {
  role: string;
  capabilities: FeatureKey[];
}

const FEATURE_FLAGS: Record<FeatureKey, string[]> = {
  LIVE_STREAMING: ['user', 'pro', 'enterprise', 'admin'],
  BOOKINGS: ['user', 'pro', 'enterprise', 'admin'],
  AI_STUDIO: ['pro', 'enterprise', 'admin'],
  PLAYLISTS: ['user', 'pro', 'enterprise', 'admin'],
  ANALYTICS: ['enterprise', 'admin'],
  SMART_FEED: ['user', 'pro', 'enterprise', 'admin'],
  SITE_BUILDER: ['pro', 'enterprise', 'admin'],
  AFFILIATE: ['user', 'pro', 'enterprise', 'admin'],
  VIDEO: ['user', 'pro', 'enterprise', 'admin'],
  PLUGINS: ['enterprise', 'admin'],
  COLLAB: ['pro', 'enterprise', 'admin'],
};

export function hasAccess(user: any, feature: FeatureKey): boolean {
  // Global feature flag check first
  if (feature === 'AI_STUDIO' && !FEATURES.AI_STUDIO) return false;
  if (feature === 'AFFILIATE' && !FEATURES.AFFILIATE) return false;
  if (feature === 'VIDEO' && !FEATURES.VIDEO) return false;
  if (feature === 'PLUGINS' && !FEATURES.PLUGINS) return false;
  if (feature === 'COLLAB' && !FEATURES.COLLAB) return false;
  
  if (!user) return false;
  
  // If user has explicit capabilities list
  if (user.capabilities?.includes(feature)) return true;
  
  // Fallback to role-based check
  const allowedRoles = FEATURE_FLAGS[feature];
  return allowedRoles?.includes(user.role || 'user') || false;
}

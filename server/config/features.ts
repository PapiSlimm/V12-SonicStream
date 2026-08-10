export const FEATURES: Record<string, string[]> = {
  // Website Features
  'custom_domain': ['star', 'visionary', 'pro', 'enterprise'],
  'unlimited_pages': ['star', 'visionary', 'pro', 'enterprise'],
  'white_label': ['visionary', 'pro', 'enterprise'],
  'custom_css': ['star', 'visionary', 'pro', 'enterprise'],
  
  // Music Features
  'dsp_distribution': ['visionary', 'pro', 'enterprise'],
  'isrc_generation': ['visionary', 'pro', 'enterprise'],
  'unlimited_tracks': ['pro', 'enterprise'],
  'ai_mastering': ['visionary', 'pro', 'enterprise'],
  
  // Commerce Features
  'unlimited_products': ['pro', 'enterprise'],
  'print_on_demand': ['visionary', 'pro', 'enterprise'],
  'multi_currency': ['visionary', 'pro', 'enterprise'],
  
  // Audience Features
  'advanced_crm': ['visionary', 'pro', 'enterprise'],
  'email_automation': ['visionary', 'pro', 'enterprise'],
  'whatsapp_integration': ['pro', 'enterprise'],
  
  // AI Features
  'ai_generation': ['star', 'visionary', 'pro', 'enterprise'],
  'custom_ai_models': ['enterprise'],
  'ai_batch_processing': ['pro', 'enterprise'],
  
  // Support Features
  'priority_support': ['visionary', 'pro', 'enterprise'],
  'dedicated_manager': ['pro', 'enterprise'],
  '24_7_support': ['pro', 'enterprise'],
};

export interface FeatureLimits {
  tracks: number;
  products: number;
  followers: number;
  events_per_month: number;
  email_sends: number;
  platform_fee: number;
}

export function getFeatureLimits(tier: string): FeatureLimits {
  const limits: Record<string, FeatureLimits> = {
    free: {
      tracks: 5,
      products: 1,
      followers: 50,
      events_per_month: 1,
      email_sends: 0,
      platform_fee: 0.04,
    },
    star: {
      tracks: 50,
      products: 25,
      followers: 1000,
      events_per_month: 10,
      email_sends: 500,
      platform_fee: 0.02,
    },
    visionary: {
      tracks: 250,
      products: 250,
      followers: 10000,
      events_per_month: 50,
      email_sends: 5000,
      platform_fee: 0.01,
    },
    pro: {
      tracks: -1, // Unlimited
      products: -1, // Unlimited
      followers: -1, // Unlimited
      events_per_month: -1, // Unlimited
      email_sends: 50000,
      platform_fee: 0.005,
    },
    enterprise: {
      tracks: -1,
      products: -1,
      followers: -1,
      events_per_month: -1,
      email_sends: -1,
      platform_fee: 0.002,
    },
  };
  return limits[tier] || limits.free;
}

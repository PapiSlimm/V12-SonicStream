export interface SubscriptionTier {
  id: string;
  name: string;
  price: number; // monthly
  annuallyPrice: number; // monthly when billed annually
  interval: 'month' | 'year';
  description: string;
  trialDays?: number;
  features: string[];
  limits: {
    uploads: number;
    marketplaceCommission: number;
    distributionRevShare: number;
    activeProducts: number;
    masteringCredits: number;
  };
  role: 'listener' | 'artist' | 'pro' | 'business' | 'visionary' | 'enterprise';
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  FREE: {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    annuallyPrice: 0,
    interval: 'month',
    description: 'Provide real value to start your production and distribution journey with zero friction.',
    features: [
      'Creator Passport: Basic Passport, Profile & Portfolio',
      'Authentication: Email/Google Login & 2FA',
      'Streaming: 5 Uploads, Standard Playlists',
      'Marketplace: Sell 2 Products (15% Commission)',
      'Distribution: Standard Distribution',
      'AI Studio: Limited AI Assistant & Credits',
      'Analytics: Basic Stream, Download & Follower counts',
      'Bookings: Submit booking requests',
      'Messaging: Community Chat & Basic DMs',
      'Search: Creator & Song Search',
      'Payments: Creator Wallet & Basic Transactions',
      'Notifications: Email & In-App Alerts',
      'Worker Services: Shared Cloud Infrastructure'
    ],
    limits: {
      uploads: 5,
      marketplaceCommission: 15,
      distributionRevShare: 15,
      activeProducts: 2,
      masteringCredits: 0
    },
    role: 'artist'
  },
  STAR: {
    id: 'star',
    name: 'Star Package',
    price: 19,
    annuallyPrice: 15,
    interval: 'month',
    description: 'Perfect for fast-growing musical creators and interactive producers.',
    trialDays: 14,
    features: [
      'Creator Passport: Advanced Passport & Verified Badge',
      'Streaming: 50 Uploads, Enhanced Streaming',
      'Marketplace: 25 Products, Storefront, 10% Commission',
      'AI Studio: 10 Mastering Credits, Artwork & Metadata',
      'Analytics: Audience Growth & Listening Trends',
      'Automation: Scheduling, Auto-Publish & Social Posts',
      'Messaging: Priority Support & Enhanced Messaging',
      'Branding: Custom CSS & Custom Domain options',
      'Worker Services: Shared High-Priority Queue'
    ],
    limits: {
      uploads: 50,
      marketplaceCommission: 10,
      distributionRevShare: 10,
      activeProducts: 25,
      masteringCredits: 10
    },
    role: 'artist'
  },
  VISIONARY: {
    id: 'visionary',
    name: 'Visionary Package',
    price: 49,
    annuallyPrice: 39,
    interval: 'month',
    description: 'Label-grade suite loaded with AI operations, A&R intelligence, and branding.',
    trialDays: 14,
    features: [
      'Creator Passport: Professional Passport & Business Verification',
      'Streaming: 250 Uploads, Priority Encoding',
      'Distribution: Direct DSP Delivery & Automatic ISRCs',
      'Marketplace: 250 Products & Print-on-Demand (5% Comm)',
      'AI Studio: AI Business Assistant, Planner & 50 Credits',
      'CRM: Customer Database & Email Campaigns',
      'Analytics: Professional Analytics & Audience Segments',
      'Recommendations: Personalized Recommendation Engine',
      'Automation: Workflows, Marketing & Release Automation',
      'Worker Services: Priority Processing'
    ],
    limits: {
      uploads: 250,
      marketplaceCommission: 5,
      distributionRevShare: 5,
      activeProducts: 250,
      masteringCredits: 50
    },
    role: 'visionary'
  },
  PRO: {
    id: 'pro',
    name: 'Pro Pack',
    price: 99,
    annuallyPrice: 79,
    interval: 'month',
    description: 'Absolute unrestricted access for premium studios, indie labels, and scaleups.',
    trialDays: 14,
    features: [
      'Creator Passport: Premium Passport & Creator Score',
      'Streaming: Unlimited Uploads & Premium Streaming',
      'Marketplace: Unlimited Products & Priority (2% Commission)',
      'AI Studio: Unlimited Mastering & Full AI Voice/Video',
      'Automation: Unlimited Automation, AI Agent & Workflows',
      'Analytics: Business Intelligence & Predictive Analytics',
      'Messaging: WhatsApp Integration & Dedicated Manager',
      'Bookings: Premium Booking Tools & Zero Ticketing Fees',
      'Collaboration: Team Collaboration & Shared Projects',
      'Worker Services: Dedicated Worker Queue'
    ],
    limits: {
      uploads: 999999,
      marketplaceCommission: 2,
      distributionRevShare: 2,
      activeProducts: 999999,
      masteringCredits: 999999
    },
    role: 'pro'
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    annuallyPrice: 239,
    interval: 'month',
    description: 'Global infrastructure, tailored machine learning, and concierge management.',
    trialDays: 14,
    features: [
      'Creator Passport: Enterprise Passport & Multi-Org support',
      'Authentication: Enterprise SSO & Advanced Access Control',
      'Streaming: Unlimited Content & Enterprise CDN',
      'Marketplace: White-label Storefronts & 0% Commission',
      'AI Studio: Custom Private AI Models & Custom Training',
      'Distribution: Enterprise DSP, Global Routing & Multicurrency',
      'Automation: Enterprise Workflow Engine & Custom Integrations',
      'Analytics: Executive Dashboards & Custom BI Reports',
      'API & SDKs: Full API Access & Webhook Integrations',
      'Administration: SLA Monitoring, Team Permissions & Audit Logs',
      'Support: Concierge Team & Dedicated Success Manager',
      'Infrastructure: Dedicated Workers, Databases & Priority Compute'
    ],
    limits: {
      uploads: 999999,
      marketplaceCommission: 0,
      distributionRevShare: 0,
      activeProducts: 999999,
      masteringCredits: 999999
    },
    role: 'enterprise'
  }
};

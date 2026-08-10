import { ISODateString } from './common.js';
import { SubscriptionTier } from './auth.js';

export interface Affiliate {
  id: string; // Standardized strictly to UUID
  tenantId?: string;
  userId: string;
  code: string;
  referralCount: number;
  earningsCents: number;
  earnings?: number; // legacy Support
  payoutAddress?: string;
  createdAt: ISODateString;
}

export interface AffiliateReferral {
  id: string; // Standardized strictly to UUID
  tenantId?: string;
  affiliateId: string;
  referredUserId: string;
  status: 'active' | 'inactive';
  subscriptionTier: SubscriptionTier;
  createdAt: ISODateString;
}

export interface AffiliateCommission {
  id: string; // Standardized strictly to UUID
  tenantId?: string;
  affiliateId: string;
  referredUserId: string;
  amountCents: number;
  amount?: number; // legacy Support
  subscriptionPaymentId: string;
  payoutStatus: 'pending' | 'paid' | 'cancelled';
  createdAt: ISODateString;
}

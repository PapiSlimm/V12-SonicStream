import { ISODateString } from './common.js';

export enum Permission {
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_PAYOUTS = 'ADMIN_PAYOUTS',
  ADMIN_MARKETPLACE = 'ADMIN_MARKETPLACE',
  ADMIN_ANALYTICS = 'ADMIN_ANALYTICS',
  CREATOR_MODERATION = 'CREATOR_MODERATION',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
}

export enum Role {
  LISTENER = 'listener',
  ARTIST = 'artist',
  ADMIN = 'admin',
  BUSINESS = 'business',
  CREATOR = 'creator',
  AFFILIATE = 'affiliate',
  VENUE = 'venue',
  PROMOTER = 'promoter',
  VENDOR = 'vendor',
  PRINTER = 'printer',
  MANAGER = 'manager',
  AGENCY = 'agency',
  ENTERPRISE = 'enterprise',
}

export type SubscriptionTier = 'free' | 'creator' | 'pro' | 'visionary' | 'enterprise';

export interface SubscriptionPlan {
  id: string; // UUID string
  name: string;
  description: string;
  priceCents: number;
  billingInterval: 'month' | 'year';
  tier: SubscriptionTier;
  isActive: boolean;
}

export interface SubscriptionUsage {
  id: string; // UUID string
  userId: string;
  planId: string;
  feature: string;
  currentUsageValue: number;
  usageLimit: number;
  resetDate: ISODateString;
}

export interface Tenant {
  id: string; // UUID string
  name: string;
  slug: string;
  createdAt: ISODateString;
}

export type NotificationType = "booking" | "sale" | "payout" | "royalty" | "message";

export interface NotificationPreference {
  userId: string;
  emailNotification: boolean;
  pushNotification: boolean;
  smsNotification: boolean;
  categories: string[];
}

export interface Notification {
  id: string; // UUID string
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: ISODateString;
}

export interface UserCore {
  id: string; // UUID string
  email: string;
  name: string;
  roles: Role[];
  userType: 'listener' | 'artist' | 'admin' | 'business'; // Maintained for backward compatibility
  tenantId?: string;
  createdAt: ISODateString;
}

export interface UserPublic extends UserCore {
  avatarUrl?: string;
  bio?: string;
  socialLinks?: string;
  isVerified: boolean;
  isPro: boolean;
}

export interface UserPrivate extends UserPublic {
  preferredGenres?: string[];
  subscriptionTier: SubscriptionTier;
  emailVerified: boolean;
}

export interface UserFinancial extends UserPrivate {
  balanceCents: number;
  balance?: number; // Legacy float support
  creditsChangeLegacy?: number;
}

export interface UserAdmin extends UserFinancial {
  aiGenerationsCount: number;
  lastAiGenerationReset: ISODateString;
  platformPermissions: Permission[];
}

export type User = UserFinancial;

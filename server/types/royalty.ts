import { ISODateString } from './common.js';

export enum RevenueType {
  STREAM = 'STREAM',
  DOWNLOAD = 'DOWNLOAD',
  LICENSE = 'LICENSE',
  SYNC = 'SYNC',
}

export interface Royalty {
  id: string; // Standardized to UUID string
  tenantId: string;
  userId: string;
  releaseId?: string; // Standardized to UUID string
  trackId?: string; // Standardized to UUID string
  revenueType: RevenueType;
  amountCents: number;
  currency: string;
  source: string;
  streams?: number;
  periodStart: ISODateString;
  periodEnd: ISODateString;
  createdAt: ISODateString;
}

export interface RoyaltyStatement {
  id: string; // Standardized to UUID string
  platformId: string; // Standardized to UUID string
  trackId: string; // Standardized to UUID string
  userId: string; // Standardized to UUID string
  amountCents: number;
  periodStart: ISODateString;
  periodEnd: ISODateString;
  streams?: number;
  createdAt: ISODateString;
}

import { ISODateString } from './common.js';

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum LedgerTransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PAYOUT = 'payout',
  ROYALTY = 'royalty',
  COMMISSION = 'commission',
}

export enum LedgerTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Wallet {
  id: string; // Standardized strictly to UUID
  userId: string;
  currency: string;
  availableBalanceCents: number;
  availableBalance?: number; // legacy Support
  pendingBalanceCents: number;
  pendingBalance?: number; // legacy Support
  updatedAt: ISODateString;
}

export interface LedgerTransaction {
  id: string; // Standardized strictly to UUID
  userId: string;
  type: LedgerTransactionType;
  amountCents: number;
  amount?: number; // legacy Support
  currency: string;
  status: LedgerTransactionStatus;
  stripeSessionId?: string;
  stripePaymentId?: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface LedgerEntry {
  id: string; // Standardized strictly to UUID
  transactionId: string;
  userId: string;
  walletId?: string;
  type: 'debit' | 'credit';
  amountCents: number;
  amount?: number; // legacy Support
  currency: string;
  description: string;
  createdAt: ISODateString;
}

export interface PlatformPayout {
  id: string; // Standardized strictly to UUID
  userId: string;
  tenantId: string;
  amountCents: number;
  amount?: number; // legacy Support
  feeCents: number;
  fee?: number; // legacy Support
  netAmountCents: number;
  netAmount?: number; // legacy Support
  status: PayoutStatus;
  stripeTransferId?: string;
  createdAt: ISODateString;
}

// Support alias Payout for backward compatibility
export type Payout = PlatformPayout;

export interface UserPayoutRequest {
  id: string; // Standardized strictly to UUID
  userId: string;
  amountCents: number;
  amount?: number; // legacy Support
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  requestedAt: ISODateString;
}

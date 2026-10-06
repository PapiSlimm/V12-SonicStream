import { ISODateString, Address } from './common.js';

export interface PrintProduct {
  id: string; // Standardized strictly to UUID
  tenantId?: string;
  name: string;
  description: string;
  basePriceCents: number;
  basePrice?: number; // legacy Support
  retailPriceCents: number;
  retailPrice?: number; // legacy Support
  itemType: 'vinyl' | 'cd' | 'tshirt' | 'poster' | 'hoodie';
  mockupUrl?: string;
  templateUrl?: string;
  status: 'active' | 'inactive';
  createdAt: ISODateString;
}

export interface PrintOrder {
  id: string; // Standardized strictly to UUID
  userId: string;
  itemType: string;
  quantity: number;
  status: string;
  totalPriceCents: number;
  totalPrice?: number; // legacy Support
  shippingAddress: Address; // Standardized to structured Address type
  createdAt: ISODateString;
}

export interface PrintOrderModern {
  id: string; // Standardized strictly to UUID
  tenantId?: string;
  userId: string;
  paymentIntentId?: string;
  customerEmail: string;
  cart: Array<{
    printProductId: string;
    quantity: number;
    customGraphicUrl?: string;
  }>;
  shippingAddress: Address; // Standardized to structured Address type
  amountChargedCents: number;
  amountCharged?: number; // legacy Support
  costEstimateCents: number;
  profitEstimateCents: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: ISODateString;
}

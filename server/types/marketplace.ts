import { ISODateString, Address } from './common.js';

export interface MarketplaceStore {
  id: string; // UUID string
  creatorId: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  status: 'active' | 'suspended';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Enterprise Alias
export type CreatorStore = MarketplaceStore;

export interface MarketplaceCategory {
  id: string; // UUID string
  name: string;
  slug: string;
  description?: string;
}

export interface MarketplaceProduct {
  id: string; // UUID string
  storeId: string;
  categoryId: string;
  name: string;
  description?: string;
  priceCents: number;
  price?: number; // legacy Support
  stockQuantity: number;
  imageUrl?: string;
  mediaUrls?: string[];
  status: 'active' | 'archived' | 'draft';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface MarketplaceOrderItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface MarketplaceOrder {
  id: string; // UUID string
  buyerId: string;
  storeId: string;
  items: MarketplaceOrderItem[];
  totalAmountCents: number;
  totalAmount?: number; // legacy Support
  shippingCostCents: number;
  taxCostCents: number;
  shippingAddress: Address;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  stripeSessionId?: string;
  stripePaymentId?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface MarketplaceReview {
  id: string; // UUID string
  productId: string;
  userId: string;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: ISODateString;
}

import { ISODateString } from './common.js';

export interface Booking {
  id: string; // Standardized strictly to UUID string
  tenantId?: string;
  artistId: string; // Standardized strictly to UUID string
  customerName: string;
  customerEmail: string;
  startTime: ISODateString;
  endTime: ISODateString;
  status: 'confirmed' | 'cancelled' | 'pending';
  paymentStatus: 'pending' | 'deposit_paid' | 'paid';
  paymentMethod?: string;
  depositAmountCents: number;
  depositAmount?: number; // legacy Support
  totalAmountCents: number;
  totalAmount?: number; // legacy Support
  
  // Expanded industry-grade CRM/Booking contracts
  venue: string;
  notes?: string;
  contractUrl?: string;
  depositDueDate?: ISODateString;
  eventType: string;
  guestCount: number;
}

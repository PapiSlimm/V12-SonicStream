import { ISODateString } from './common.js';

export interface SonicEvent {
  id: string; // Standardized strictly to UUID
  artistId: string; // Standardized strictly to UUID
  title: string;
  description?: string;
  date: ISODateString;
  venue: string;
  city: string;
  priceCents: number;
  price?: number; // legacy Support
  ticketsAvailable: number;
  imageUrl?: string;
  genre?: string;
  lat?: number;
  lng?: number;
  createdAt: ISODateString;
}

export interface TicketType {
  id: string; // UUID string
  eventId: string; // UUID string
  name: string;
  description?: string;
  priceCents: number;
  price?: number; // legacy Support
  capacity: number;
  soldCount: number;
  saleStartDate?: ISODateString;
  saleEndDate?: ISODateString;
  createdAt: ISODateString;
}

export interface Ticket {
  id: string; // UUID string
  orderId: string; // UUID string
  ticketTypeId: string; // UUID string
  ticketNumber: string; // Secure unique identifier (e.g. "TKT-123456-ABC")
  ownerName: string;
  ownerEmail: string;
  status: 'active' | 'used' | 'refunded' | 'cancelled';
  barcodeUrl?: string; // Standard scan asset routing
  createdAt: ISODateString;
}

export interface TicketOrderItem {
  ticketTypeId: string;
  quantity: number;
  priceCents: number;
}

export interface TicketOrder {
  id: string; // UUID string
  eventId: string; // UUID string
  buyerId: string;
  items: TicketOrderItem[];
  totalAmountCents: number;
  totalAmount?: number; // legacy Support
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TicketScan {
  id: string; // UUID string
  ticketId: string; // UUID string
  scannedBy: string; // userId of ticket scanner staff
  scanTime: ISODateString;
  status: 'valid' | 'invalid_already_scanned' | 'invalid_wrong_event' | 'invalid_other';
  deviceDetails?: string;
}

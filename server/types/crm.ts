import { ISODateString } from './common.js';

export type CRMContactType = 'fan' | 'venue_curator' | 'booker' | 'promoter' | 'vip';
export type CRMLifecycleStage = 'lead' | 'contact' | 'customer' | 'advocate';

export interface CRMContact {
  id: string; // UUID string
  tenantId?: string;
  userId: string; // The artist/business owner of this contact
  name: string;
  email: string;
  phone?: string;
  type: CRMContactType;
  lifecycleStage: CRMLifecycleStage;
  notes?: string;
  tags?: string[];
  lastInteractionAt?: ISODateString;
  createdAt: ISODateString;
}

export interface CRMInteraction {
  id: string; // UUID string
  tenantId?: string;
  contactId: string; // UUID string
  userId: string;
  type: 'email' | 'call' | 'meeting' | 'social_message' | 'note';
  notes: string;
  createdAt: ISODateString;
}

export interface CRMDeal {
  id: string; // UUID string
  tenantId?: string;
  contactId: string; // UUID string
  userId: string;
  name: string;
  stage: 'lead' | 'contacted' | 'proposal_sent' | 'negotiating' | 'won' | 'lost';
  valueCents: number;
  value?: number; // legacy Support
  expectedCloseDate?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CRMTask {
  id: string; // UUID string
  tenantId?: string;
  contactId?: string; // UUID string
  userId: string;
  title: string;
  description?: string;
  dueDate?: ISODateString;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: ISODateString;
  updatedAt?: ISODateString;
}

export interface CRMCampaign {
  id: string; // UUID string
  tenantId?: string;
  userId: string;
  name: string;
  subject: string;
  content: string; // Marketing script copy / body
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  sentAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

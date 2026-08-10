export type ISODateString = string;

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface AuditLog {
  id: string; // UUID string
  tenantId?: string;
  userId: string;
  action: string;
  actorId: string;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
}

export interface FeatureFlag {
  id: string; // UUID string
  tenantId?: string;
  key: string;
  description?: string;
  isEnabled: boolean;
  rules?: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface WebhookEvent {
  id: string; // UUID string
  tenantId?: string;
  provider: string; // e.g. 'stripe', 'sendgrid'
  eventType: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processed' | 'failed';
  errorMessage?: string;
  createdAt: ISODateString;
  processedAt?: ISODateString;
}

export interface ApiKey {
  id: string; // UUID string
  tenantId?: string;
  userId: string;
  name: string;
  prefix: string;
  hashedKey: string;
  scopes: string[];
  expiresAt?: ISODateString;
  createdAt: ISODateString;
  lastUsedAt?: ISODateString;
}

export interface TenantSettings {
  id: string; // UUID string
  tenantId: string;
  customDomain?: string;
  themeConfig?: Record<string, unknown>;
  paymentSettings?: Record<string, unknown>;
  updatedAt: ISODateString;
}

export interface SupportTicket {
  id: string; // UUID string
  tenantId?: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

import { ISODateString } from './common.js';

export interface ArtistAnalytics {
  totalStreams: number;
  monthlyListeners: number;
  revenueCents: {
    totalCents: number;
    artistShareCents: number;
    platformShareCents: number;
  };
  revenue?: { // legacy Support
    total: number;
    artistShare: number;
    platformShare: number;
  };
  demographics?: {
    ageGroups: Record<string, number>;
    topCountries: { country: string; count: number }[];
  };
  platformDistribution: { name: string; streams: number }[];
}

export interface EventLog {
  id: string; // Standardized strictly to UUID
  tenantId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: ISODateString;
}

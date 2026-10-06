import { ISODateString } from './common.js';

export interface AIJob {
  id: string; // Standardized strictly to UUID
  tenantId?: string;
  userId: string;
  jobType: string; // Open-ended string for future extensible jobs (website_builder, social_post, etc.)
  provider: string; // e.g. "google", "openai", "replicate"
  model: string; // e.g. "gemini-2.5-pro", "dall-e-3"
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputUrl?: string;
  outputUrl?: string;
  profitFeeRatePercent: number; // e.g. 5.5%
  createdAt: ISODateString;
  completedAt?: ISODateString;
}

export interface AIGeneratedProduct {
  id: string; // Standardized strictly to UUID
  tenantId?: string;
  productId: string;
  aiJobId: string;
  createdAt: ISODateString;
}

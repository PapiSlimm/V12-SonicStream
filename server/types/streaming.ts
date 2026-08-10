import { ISODateString } from './common.js';

export type ArtistType = "artist" | "band" | "dj" | "producer" | "podcaster";

export interface ReleaseMetadata {
  language?: string;
  copyright?: string;
  producer?: string;
  contributors?: string[];
}

export enum ReleaseType {
  SINGLE = 'SINGLE',
  EP = 'EP',
  ALBUM = 'ALBUM',
}

export enum ReleaseStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  VALIDATING = 'VALIDATING',
  PACKAGED = 'PACKAGED',
  SUBMITTED = 'SUBMITTED',
  DISTRIBUTED = 'DISTRIBUTED',
  LIVE = 'LIVE',
  FAILED = 'FAILED',
}

export enum TrackStatus {
  DRAFT = 'DRAFT',
  UPLOADED = 'UPLOADED',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
}

export interface TrackCore {
  id: string; // Standardized strictly to UUID
  tenantId?: string;
  userId: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration: number;
  isrc?: string;
  createdAt: ISODateString;
}

export interface TrackStreaming extends TrackCore {
  streamUrl?: string;
  hlsUrl?: string;
  dashUrl?: string;
  position: number;
  explicit: boolean;
  isVideo: boolean;
}

export interface TrackDistribution extends TrackStreaming {
  releaseId: string;
  tenantId: string;
  status: TrackStatus;
  moderationStatus: string;
}

export interface TrackStats {
  plays: number;
  likes: number;
  shares: number;
}

// Global Legacy compat mapping
export type Track = TrackDistribution & {
  plays: number;
  priceCents: number;
  price?: number; // legacy Support
  moderationStatus: string;
  editorialFeatured?: boolean;
};

export interface Release {
  id: string; // Standardized UUID
  tenantId: string;
  userId: string;
  artistId?: string;
  title: string;
  type: ReleaseType;
  status: ReleaseStatus;
  upc: string;
  artworkUrl?: string;
  releaseDate?: ISODateString;
  genre?: string;
  label?: string;
  metadata?: ReleaseMetadata;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Artist {
  id: string; // Standardized strictly to UUID string
  userId: string;
  tenantId: string;
  name: string;
  type?: ArtistType;
  bio?: string;
  imageUrl?: string;
  genre?: string;
  priceCents: number;
  price?: number; // legacy Support
  duration: number;
  marketPricing?: Record<string, unknown>;
  followerCount: number;
  createdAt: ISODateString;
}

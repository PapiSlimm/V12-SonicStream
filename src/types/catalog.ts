export interface TrackMetadata {
  id: string;
  isrc: string;
  title: string;
  artist: string;
  composers: string[];
  genres: string[];
  subgenres: string[];
  mood: string;
  language: string;
  lyrics: string;
  bpm: number;
  key: string;
  duration: number;
  price: number;
  file_key: string;
  download_url?: string;
}

export interface Release {
  id: string;
  artist_id: number;
  title: string;
  artist: string;
  release_date: string;
  status: 'draft' | 'metadata_complete' | 'artwork_uploaded' | 'ready_for_review' | 'submitted' | 'live';
  tracks: TrackMetadata[];
  artwork_url: string;
  upc: string;
  distributor: 'distrokid' | 'bandzoogle' | 'direct';
  metadata: {
    genres: string[];
    subgenres: string[];
    mood_tags: string[];
    language: string;
    pricing_tier: 'standard' | 'premium';
    composers?: string[];
    lyrics?: string;
  };
  review_notes?: string;
  created_at: string;
}

export interface Catalog {
  releases: Release[];
  total_releases: number;
  total_tracks: number;
  revenue_30d: number;
}

export interface DigitalTrack extends TrackMetadata {
  is_purchased?: boolean;
}

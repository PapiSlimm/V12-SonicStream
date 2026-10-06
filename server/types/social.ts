import { ISODateString } from './common.js';

export interface Media {
  url: string;
  type: 'image' | 'video' | 'audio';
  thumbnailUrl?: string;
  duration?: number;
}

export interface Post {
  id: string; // UUID string
  userId: string;
  content?: string;
  media: Media[];
  type: 'text' | 'video' | 'photo' | 'product' | 'image' | 'music';
  isPromotion: boolean;
  productId?: string;
  musicId?: string;
  status: 'live' | 'archived' | 'deleted';
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  music?: {
    title: string;
    artist: string;
  };
  createdAt: ISODateString;
  updatedAt?: ISODateString;
}

export interface PostView extends Post {
  user: {
    name: string;
    avatarUrl?: string;
    isVerified: boolean;
    isPro: boolean;
  };
  hasLiked: boolean;
}

export interface Comment {
  id: string; // UUID string
  postId: string;
  userId: string;
  content: string;
  createdAt: ISODateString;
}

export interface Like {
  userId: string;
  postId: string;
  createdAt: ISODateString;
}

export interface Room {
  id: string; // UUID string
  title: string;
  hostId: string;
  type: 'audio' | 'video';
  status: 'live' | 'ended' | 'scheduled';
  isPaid: boolean;
  priceCents: number;
  price?: number; // Legacy, optional
  createdAt: ISODateString;
}

export interface RoomParticipant {
  roomId: string; // UUID string
  userId: string;
  role: 'host' | 'speaker' | 'listener';
  joinedAt: ISODateString;
}

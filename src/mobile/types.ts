export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isVerified: boolean;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  mediaUrl: string;
  type: 'video' | 'image' | 'music';
  likes: number;
  comments: number;
  shares: number;
  musicTitle?: string;
  musicArtist?: string;
}

export interface Room {
  id: string;
  title: string;
  host: User;
  participants: number;
  type: 'audio' | 'video';
  isPaid: boolean;
  price?: number;
}

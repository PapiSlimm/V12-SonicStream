import { apiFetch, json } from './apiFetch';
import { Artist, Track, ArtistAnalytics, RoyaltyStatement, Payout, DeliveryJob } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export const artistApi = {
  getAnalytics: () => apiFetch<ArtistAnalytics>('/api/artist/analytics'),
  getEarnings: () => apiFetch<{ balance: number, threshold: number, autoPayout: boolean, royalties: RoyaltyStatement[], payouts: Payout[] }>('/api/artist/earnings'),
  withdraw: (amount: number, method: string) => apiFetch<{ success: boolean, payoutId: number }>('/api/artist/withdraw', {
    method: 'POST',
    ...json({ amount, method })
  }),
  getDeliveryStatus: () => apiFetch<DeliveryJob[]>('/api/artist/delivery-status'),
  getAvailability: () => apiFetch<any[]>('/api/artist/availability'),
  updateAvailability: (availability: any[]) => apiFetch<{ success: boolean }>('/api/artist/availability', {
    method: 'POST',
    ...json({ availability })
  }),
  getArtists: async () => {
    return apiFetch<Artist[]>('/api/artist');
  },
  getProfile: async (id: string) => {
    return apiFetch<Artist>(`/api/artist/${id}`);
  },
  getTracks: async (artistId: string) => {
    return apiFetch<Track[]>(`/api/artist/${artistId}/tracks`);
  },
  getEvents: async (artistId: string) => {
    return apiFetch<any[]>(`/api/artist/${artistId}/events`);
  },
  follow: async (id: string) => {
    return apiFetch<{ success: true; following: true }>(`/api/artist/${id}/follow`, {
      method: 'POST'
    });
  },
  unfollow: async (id: string) => {
    return apiFetch<{ success: true; following: false }>(`/api/artist/${id}/unfollow`, {
      method: 'POST'
    });
  },
  updateProfile: async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'users', id), data);
      return { success: true };
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  }
};

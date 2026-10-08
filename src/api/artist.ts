import { apiFetch, json } from './apiFetch';
import { Artist, Track, ArtistAnalytics, RoyaltyStatement, Payout, DeliveryJob } from '../types';
// 2026-10-08: Firestore removed — profile updates go through our own API.

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
  updateProfile: async (_id: string, data: any) => {
    // Server enforces that you can only update YOUR OWN profile (the old
    // Firestore write accepted any user id — that was also a security hole).
    await apiFetch<{ success: boolean }>('/api/user/profile', {
      method: 'PUT',
      ...json(data)
    });
    return { success: true };
  }
};

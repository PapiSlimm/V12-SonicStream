import { apiFetch, json } from './apiFetch';
import { Track, Payout, User, DeliveryJob } from '../types';

export const adminApi = {
  getPendingTracks: async () => {
    return apiFetch<Track[]>('/api/admin/pending-tracks');
  },
  approveTrack: async (id: string) => {
    return apiFetch<{ success: true }>(`/api/admin/tracks/${id}/approve`, {
      method: 'POST'
    });
  },
  rejectTrack: async (id: string) => {
    return apiFetch<{ success: true }>(`/api/admin/tracks/${id}/reject`, {
      method: 'POST'
    });
  },
  getPayoutRequests: () => apiFetch<Payout[]>('/api/admin/payout-requests'),
  processPayout: (id: string, action: 'complete' | 'reject') => apiFetch<{ success: boolean }>(`/api/admin/process-payout/${id}`, {
    method: 'POST',
    ...json({ action })
  }),
  getUsers: async () => {
    return apiFetch<User[]>('/api/admin/users');
  },
  updateUser: async (id: string, data: Partial<User>) => {
    return apiFetch<User>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      ...json(data)
    });
  },
  deleteUser: async (id: string) => {
    return apiFetch<{ success: true }>(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  },
  getStats: () => apiFetch<{ users: number, tracks: number }>('/api/admin/stats'),
  runReminders: () => apiFetch<{ success: boolean }>('/api/admin/run-reminders', { method: 'POST' }),
  precomputeSimilar: () => apiFetch<{ success: boolean; precomputedCount: number }>('/api/admin/precompute-similar', { method: 'POST' }),
  processDelivery: () => apiFetch<{ success: boolean; processedCount: number }>('/api/admin/process-delivery', { method: 'POST' }),
  resolveTicket: (id: string, response: string) => apiFetch<{ success: boolean }>(`/api/admin/tickets/${id}/resolve`, { 
    method: 'POST',
    ...json({ response })
  }),
  getDeliveryJobs: () => apiFetch<DeliveryJob[]>('/api/admin/delivery-jobs'),
  updateDeliveryJob: (id: string, status: string) => apiFetch<{ success: boolean }>(`/api/admin/delivery-jobs/${id}`, {
    method: 'PATCH',
    ...json({ status })
  })
};

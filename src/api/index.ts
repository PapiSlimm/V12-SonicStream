import { apiFetch, json } from './apiFetch';
import { authApi } from './auth';
import { tracksApi } from './tracks';
import { artistApi } from './artist';
import { adminApi } from './admin';
import { playlistsApi } from './playlists';
import { commerceApi } from './commerce';
import { aiApi } from './ai';
import { userApi } from './user';
import { 
  Track, 
  Artist, 
  Venue,
  Booking, 
  Stats, 
  Notification, 
  EmailLog, 
  SupportTicket,
  ProAsset
} from '../types';
// 2026-10-08: Firestore removed — every call below goes to our own server.

export * from './apiError';
export * from './apiFetch';
export * from './auth';
export * from './tracks';
export * from './artist';
export * from './admin';
export * from './playlists';
export * from './commerce';
export * from './ai';
export * from './user';

export const api = {
  auth: authApi,
  tracks: tracksApi,
  artist: artistApi,
  admin: adminApi,
  playlists: playlistsApi,
  commerce: commerceApi,
  ai: aiApi,
  user: userApi,
  
  search: {
    query: async (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch<{ tracks: Track[]; artists: Artist[]; events: any[] }>(`/api/search?${qs}`);
    }
  },

  verification: {
    submit: (data: any) => apiFetch<{ id: string; success: boolean }>('/api/verification', {
      method: 'POST',
      ...json(data)
    }),
    getRequests: () => apiFetch<any[]>('/api/verification/requests'),
    updateStatus: (requestId: string, userId: string, status: 'verified' | 'rejected', notes?: string) =>
      apiFetch<{ success: boolean }>(`/api/verification/requests/${requestId}/status`, {
        method: 'POST',
        ...json({ status, userId, notes })
      })
  },

  support: {
    getTickets: () => apiFetch<SupportTicket[]>('/api/support/tickets'),
    createTicket: (ticket: Partial<SupportTicket>) => apiFetch<{ success: boolean }>('/api/support/tickets', {
      method: 'POST',
      ...json(ticket)
    })
  },

  bookings: {
    getAll: async () => {
      return apiFetch<Booking[]>('/api/bookings');
    },
    getArtistBookings: async () => {
      return apiFetch<Booking[]>('/api/bookings/artist');
    },
    create: async (booking: any) => {
      return apiFetch<{ id: string; success: true }>('/api/bookings', {
        method: 'POST',
        ...json(booking)
      });
    },
    confirm: async (id: string) => {
      return apiFetch<{ success: true }>(`/api/bookings/${id}/confirm`, {
        method: 'POST'
      });
    },
    reject: async (id: string) => {
      return apiFetch<{ success: true }>(`/api/bookings/${id}/reject`, {
        method: 'POST'
      });
    }
  },

  events: {
    getAll: () => apiFetch<any[]>('/api/events'),
    getMyEvents: () => apiFetch<any[]>('/api/events/mine'),
    create: (event: any) => apiFetch<any>('/api/events', { method: 'POST', ...json(event) }),
    update: (id: string, event: any) => apiFetch<any>(`/api/events/${id}`, { method: 'PUT', ...json(event) }),
    delete: (id: string) => apiFetch<{ success: boolean }>(`/api/events/${id}`, { method: 'DELETE' })
  },

  stats: {
    get: () => apiFetch<Stats>('/api/stats')
  },

  notifications: {
    getNotifications: async () => {
      return apiFetch<Notification[]>('/api/notifications');
    },
    getPreferences: () => apiFetch<any>('/api/notifications/preferences'),
    updatePreferences: (prefs: any) => apiFetch<void>('/api/notifications/preferences', {
      method: 'POST',
      ...json(prefs)
    }),
    markRead: async (id: string) => {
      return apiFetch<void>(`/api/notifications/${id}/read`, {
        method: 'POST'
      });
    },
    markAllRead: async () => {
      return apiFetch<void>('/api/notifications/read-all', {
        method: 'POST'
      });
    }
  },

  emailLogs: {
    getAll: () => apiFetch<EmailLog[]>('/api/email-logs')
  },

  recommendations: {
    get: () => apiFetch<any[]>('/api/recommendations')
  },

  integrations: {
    getTikTokUrl: () => apiFetch<{ url: string }>('/api/integrations/tiktok/url'),
    getApiKeys: () => apiFetch<any[]>('/api/integrations/api-keys'),
    createApiKey: (service_name: string, api_key: string) => apiFetch<{ id: string }>('/api/integrations/api-keys', {
      method: 'POST',
      ...json({ service_name, api_key })
    }),
    deleteApiKey: (id: string) => apiFetch<void>(`/api/integrations/api-keys/${id}`, { method: 'DELETE' })
  },

  siteBuilder: {
    getSites: () => apiFetch<any[]>('/api/site-builder/sites'),
    createSite: (data: any) => apiFetch<any>('/api/site-builder/sites', {
      method: 'POST',
      ...json(data)
    }),
    updateSite: (id: number, data: any) => apiFetch<any>(`/api/site-builder/sites/${id}`, {
      method: 'PATCH',
      ...json(data)
    }),
    unlockForVisionary: () => apiFetch<{ success: boolean }>('/api/site-builder/unlock', { method: 'POST' })
  },

  distribution: {
    getSmartLinks: async () => {
      return apiFetch<any[]>('/api/distribution/smart-links');
    },
    createSmartLink: async (data: any) => {
      return apiFetch<{ id: string; success: true }>('/api/distribution/smart-links', {
        method: 'POST',
        ...json(data)
      });
    },
    deleteSmartLink: async (id: string) => {
      return apiFetch<{ success: true }>(`/api/distribution/smart-links/${id}`, {
        method: 'DELETE'
      });
    },
    distribute: async (trackId: string, platforms: string[]) => {
      return apiFetch<{ success: true; message: string }>('/api/distribution/distribute', {
        method: 'POST',
        ...json({ trackId, platforms })
      });
    }
  },

  assets: {
    getAll: async () => {
      return apiFetch<ProAsset[]>('/api/assets');
    }
  },

  rss: {
    getFeeds: async (type?: string) => {
      const url = type ? `/api/rss?type=${type}` : '/api/rss';
      return apiFetch<any[]>(url);
    },
    share: async (feedId: string) => {
      return apiFetch<{ success: true }>(`/api/rss/share/${feedId}`, {
        method: 'POST'
      });
    },
    postProduct: async (data: { title: string; content: string; price: number; productLink: string; mediaUrl?: string }) => {
      return apiFetch<{ success: true }>('/api/rss/product', {
        method: 'POST',
        ...json(data)
      });
    }
  },

  venues: {
    getAll: () => apiFetch<Venue[]>('/api/venues'),
    getById: (id: string) => apiFetch<Venue>(`/api/venues/${id}`),
    getMyVenues: () => apiFetch<Venue[]>('/api/venues/my-venues'),
    create: (data: Partial<Venue>) => apiFetch<Venue>('/api/venues', {
      method: 'POST',
      ...json(data)
    }),
    update: (id: string, data: Partial<Venue>) => apiFetch<Venue>(`/api/venues/${id}`, {
      method: 'PATCH',
      ...json(data)
    }),
    delete: (id: string) => apiFetch<void>(`/api/venues/${id}`, { method: 'DELETE' })
  },

  public: {
    getReleaseBySlug: (slug: string) =>
      apiFetch<any>(`/api/distribution/smart-links/slug/${encodeURIComponent(slug)}`)
  },

  radio: {
    getSimilarArtists: (artistId: string) => apiFetch<Artist[]>(`/api/radio/similar/${artistId}`),
    getGenreRadio: (genre: string) => apiFetch<Track[]>(`/api/radio/genre/${genre}`)
  },

  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body?: any) => apiFetch<T>(url, {
    method: 'POST',
    ...json(body)
  })
};

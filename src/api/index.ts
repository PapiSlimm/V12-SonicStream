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
import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';

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
      const searchTerm = params.q?.toLowerCase() || '';
      try {
        const tracksSnap = await getDocs(collection(db, 'tracks'));
        const artistsSnap = await getDocs(collection(db, 'artists'));
        const eventsSnap = await getDocs(collection(db, 'events'));

        const tracks = tracksSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as unknown as Track))
          .filter(t => t.title.toLowerCase().includes(searchTerm) || 
                       (t.displayArtistName || '').toLowerCase().includes(searchTerm));

        const artists = artistsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as unknown as Artist))
          .filter(a => a.name.toLowerCase().includes(searchTerm));

        const events = eventsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(e => e.title.toLowerCase().includes(searchTerm) || e.venue.toLowerCase().includes(searchTerm));

        return { tracks, artists, events };
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, 'search');
      }
    }
  },

  verification: {
    submit: async (data: any) => {
      if (!auth.currentUser) throw new Error('Not authenticated');
      try {
        const docRef = await addDoc(collection(db, 'verification_requests'), {
          ...data,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'Anonymous',
          userEmail: auth.currentUser.email,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          verificationStatus: 'pending'
        });

        return { id: docRef.id, success: true };
      } catch (error) {
        return handleFirestoreError(error, OperationType.CREATE, 'verification_requests');
      }
    },
    getRequests: async () => {
      try {
        const q = query(collection(db, 'verification_requests'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, 'verification_requests');
      }
    },
    updateStatus: async (requestId: string, userId: string, status: 'verified' | 'rejected', notes?: string) => {
      try {
        await updateDoc(doc(db, 'verification_requests', requestId), {
          status,
          adminNotes: notes,
          updatedAt: new Date().toISOString()
        });
        
        await updateDoc(doc(db, 'users', userId), {
          verificationStatus: status,
          isVerified: status === 'verified'
        });

        return { success: true };
      } catch (error) {
        return handleFirestoreError(error, OperationType.UPDATE, `verification_requests/${requestId}`);
      }
    }
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
    getAll: async () => {
      try {
        const q = query(collection(db, 'events'), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, 'events');
      }
    },
    getMyEvents: async () => {
      if (!auth.currentUser) throw new Error('Not authenticated');
      try {
        const q = query(collection(db, 'events'), where('artistId', '==', auth.currentUser.uid), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, 'events/my');
      }
    },
    create: async (event: any) => {
      if (!auth.currentUser) throw new Error('Not authenticated');
      try {
        const docRef = await addDoc(collection(db, 'events'), {
          ...event,
          artistId: auth.currentUser.uid,
          artist_name: auth.currentUser.displayName || 'Anonymous',
          createdAt: serverTimestamp()
        });
        return { id: docRef.id, success: true };
      } catch (error) {
        return handleFirestoreError(error, OperationType.CREATE, 'events');
      }
    },
    update: async (id: string, event: any) => {
      try {
        await updateDoc(doc(db, 'events', id), event);
        return { success: true };
      } catch (error) {
        return handleFirestoreError(error, OperationType.UPDATE, `events/${id}`);
      }
    },
    delete: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'events', id));
        return { success: true };
      } catch (error) {
        return handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
      }
    }
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
    getReleaseBySlug: async (slug: string) => {
      try {
        const q = query(collection(db, 'smart_links'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        if (snapshot.empty) throw new Error('Release not found');
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as any;
      } catch (error) {
        return handleFirestoreError(error, OperationType.GET, `public/release/${slug}`);
      }
    }
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

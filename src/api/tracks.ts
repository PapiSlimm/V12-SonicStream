import { apiFetch, json } from './apiFetch';
import { Track } from '../types';
// 2026-10-08: Firestore removed — pagination and play counts now hit our own API.

export const tracksApi = {
  getAll: async () => {
    return apiFetch<Track[]>('/api/tracks');
  },
  getPaginated: async (pageSize: number = 20, lastDoc?: any) => {
    // lastDoc is a numeric offset cursor now (was a Firestore snapshot).
    const offset = typeof lastDoc === 'number' ? lastDoc : 0;
    const items = await apiFetch<Track[]>('/api/tracks');
    const page = items.slice(offset, offset + pageSize);
    return {
      items: page,
      lastDoc: offset + page.length < items.length ? offset + page.length : null
    };
  },
  getArtistTracks: async (artistId?: string) => {
    const url = artistId ? `/api/tracks?artistId=${artistId}` : '/api/tracks';
    return apiFetch<Track[]>(url);
  },
  getById: async (id: string) => {
    return apiFetch<Track>(`/api/tracks/${id}`);
  },
  upload: async (data: Partial<Track> | FormData) => {
    let body;
    if (data instanceof FormData) {
      body = data;
    } else {
      body = JSON.stringify({ data: JSON.stringify(data) });
    }
    
    return apiFetch<{ id: string; isrc: string; message: string }>('/api/tracks', {
      method: 'POST',
      body
    });
  },
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ url: string }>('/api/tracks/upload-file', {
      method: 'POST',
      body: formData
    });
  },
  getStreamUrl: (id: string) => `/api/tracks/${id}/stream`,
  update: async (id: string, data: Partial<Track>) => {
    return apiFetch<{ success: true }>(`/api/tracks/${id}`, {
      method: 'PATCH',
      ...json(data)
    });
  },
  master: async (id: string, options: { settings?: any; profile?: string } = {}) => {
    return apiFetch<{ message: string }>(`/api/tracks/${id}/master`, {
      method: 'POST',
      ...json(options)
    });
  },
  incrementPlays: async (id: string) => {
    try {
      await apiFetch<{ success: boolean }>(`/api/tracks/${id}/play`, {
        method: 'POST',
        ...json({ duration: 0 })
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to increment plays', error);
      return { success: false };
    }
  }
};

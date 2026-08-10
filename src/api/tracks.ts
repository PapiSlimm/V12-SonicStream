import { apiFetch, json } from './apiFetch';
import { Track } from '../types';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, limit, startAfter, getDocs, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';

export const tracksApi = {
  getAll: async () => {
    return apiFetch<Track[]>('/api/tracks');
  },
  getPaginated: async (pageSize: number = 20, lastDoc?: any) => {
    try {
      let q = query(
        collection(db, 'tracks'), 
        orderBy('createdAt', 'desc'), 
        limit(pageSize)
      );
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(q);
      return {
        items: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Track)),
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, 'tracks');
    }
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
      const docRef = doc(db, 'tracks', id);
      const trackDoc = await getDoc(docRef);
      if (trackDoc.exists()) {
        const currentPlays = trackDoc.data().plays || 0;
        await updateDoc(docRef, { plays: currentPlays + 1 });
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to increment plays', error);
      return { success: false };
    }
  }
};

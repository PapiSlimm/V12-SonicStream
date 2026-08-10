import { apiFetch, json } from './apiFetch';
import { Playlist, Track } from '../types';

export const playlistsApi = {
  getAll: () => apiFetch<Playlist[]>('/api/playlists'),
  getById: (id: string) => apiFetch<Playlist & { tracks: Track[]; collaborators: any[] }>(`/api/playlists/${id}`),
  create: (data: any) => apiFetch<Playlist>('/api/playlists', {
    method: 'POST',
    ...json(data)
  }),
  update: (id: string, data: any) => apiFetch<{ success: boolean }>(`/api/playlists/${id}`, {
    method: 'PUT',
    ...json(data)
  }),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/playlists/${id}`, {
    method: 'DELETE'
  }),
  addTrack: (id: string, trackId: string) => apiFetch<{ success: boolean }>(`/api/playlists/${id}/tracks`, {
    method: 'POST',
    ...json({ trackId })
  }),
  removeTrack: (id: string, trackId: string) => apiFetch<{ success: boolean }>(`/api/playlists/${id}/tracks/${trackId}`, {
    method: 'DELETE'
  }),
  reorder: (id: string, trackIds: string[]) => apiFetch<{ success: boolean }>(`/api/playlists/${id}/reorder`, {
    method: 'POST',
    ...json({ trackIds })
  }),
  addCollaborator: (id: string, userId: string, role: string = 'editor') => apiFetch<{ success: boolean }>(`/api/playlists/${id}/collaborators`, {
    method: 'POST',
    ...json({ userId, role })
  }),
  removeCollaborator: (id: string, userId: string) => apiFetch<{ success: boolean }>(`/api/playlists/${id}/collaborators/${userId}`, {
    method: 'DELETE'
  })
};

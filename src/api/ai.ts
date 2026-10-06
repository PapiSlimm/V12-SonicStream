import { apiFetch, json } from './apiFetch';
import { Track } from '../types';

export const aiApi = {
  ask: (prompt: string) => apiFetch<{ response: string }>('/api/ai/music', {
    method: 'POST',
    ...json({ prompt })
  }),
  generateImage: (prompt: string, aspectRatio: string = "1:1") => apiFetch<{ imageUrl: string }>('/api/ai/generate-image', {
    method: 'POST',
    ...json({ prompt, aspectRatio })
  }),
  generatePlaylist: (prompt: string) => apiFetch<{ tracks: Track[] }>('/api/ai/generate-playlist', {
    method: 'POST',
    ...json({ prompt })
  })
};

import { apiFetch, json } from './apiFetch';
import { User } from '../types';

export const userApi = {
  getProfile: async () => {
    return apiFetch<User>('/api/user/profile');
  },
  updateProfile: async (data: Partial<User>) => {
    return apiFetch<User>('/api/user/profile', {
      method: 'PATCH',
      ...json(data)
    });
  },
  uploadAvatar: (formData: FormData) => apiFetch<{ avatarUrl: string }>('/api/user/avatar/upload', {
    method: 'POST',
    body: formData
  }),
  search: (query: string) => apiFetch<User[]>(`/api/user/search?q=${encodeURIComponent(query)}`)
};

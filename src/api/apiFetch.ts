import { getToken } from '../lib/sonicAuth';
import { ApiError } from './apiError';

// 2026-10-07 — SONIC AUTH: bearer token now comes from our own session store,
// not Firebase (whose suspended GCP project made every request hang/503).
const getAuthHeader = async (): Promise<Record<string, string>> => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Standard JSON helper - now passes through camelCase to the server
 */
export const json = (data: any) => ({
  body: JSON.stringify(data),
  headers: { 'Content-Type': 'application/json' }
});

export const apiFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const authHeader = await getAuthHeader();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...authHeader,
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(text || `Request failed with status ${res.status}`, res.status);
    }

    if (res.status === 204) return {} as T;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Expected JSON but got ${contentType}. ${text.slice(0, 200)}`);
    }

    // Server now returns camelCase (thanks to db mapping), so we just return it
    return await res.json() as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    throw error;
  }
};


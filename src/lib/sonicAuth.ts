/**
 * SONIC AUTH client (2026-10-07) — self-hosted session management.
 * Replaces Firebase Auth on the client: tokens are issued by our own
 * /api/auth endpoints and kept in localStorage.
 */

const TOKEN_KEY = 'sonic_token';
const REFRESH_KEY = 'sonic_refresh';
const USER_KEY = 'sonic_user';

export interface SonicUser {
  id: string;
  email: string;
  name: string;
  userType?: string;
  subscriptionTier?: string;
  isPro?: boolean;
  avatarUrl?: string | null;
  [key: string]: any;
}

type Listener = (user: SonicUser | null) => void;
const listeners = new Set<Listener>();

export const getToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

export const getStoredUser = (): SonicUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const persist = (token: string | null, refresh: string | null, user: SonicUser | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh); else localStorage.removeItem(REFRESH_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); else localStorage.removeItem(USER_KEY);
  } catch { /* storage unavailable — session just won't persist */ }
  listeners.forEach(l => l(user));
};

async function authRequest(path: string, body: any): Promise<{ token: string; refreshToken: string; user: SonicUser }> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function login(email: string, password: string): Promise<SonicUser> {
  const data = await authRequest('/api/auth/login', { email, password });
  persist(data.token, data.refreshToken, data.user);
  return data.user;
}

export async function register(email: string, password: string, name?: string, userType?: string): Promise<SonicUser> {
  const data = await authRequest('/api/auth/register', { email, password, name, userType });
  persist(data.token, data.refreshToken, data.user);
  return data.user;
}

export async function fetchMe(): Promise<SonicUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) {
    // Try one refresh before giving up
    const ok = await tryRefresh();
    if (!ok) { persist(null, null, null); return null; }
    const retry = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${getToken()}`, Accept: 'application/json' },
    });
    if (!retry.ok) { persist(null, null, null); return null; }
    const user = await retry.json();
    persist(getToken(), localStorage.getItem(REFRESH_KEY), user);
    return user;
  }
  if (!res.ok) return getStoredUser(); // transient server error — keep session
  const user = await res.json();
  persist(token, localStorage.getItem(REFRESH_KEY), user);
  return user;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    try {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
    } catch { /* ignore */ }
    return true;
  } catch { return false; }
}

export function logout(): void {
  persist(null, null, null);
}

export function onAuthChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* eslint-disable react-refresh/only-export-components */
/**
 * 2026-10-07 — SONIC AUTH rewrite.
 * This context previously booted on Firebase's onAuthStateChanged. The Firebase
 * project is hosted in the suspended GCP account, so Google returns 503 and the
 * listener never settled — every protected page looped on the loading screen.
 * Sessions are now our own JWTs from /api/auth, verified against our server.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as sonicAuth from '../lib/sonicAuth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isArtist: boolean;
  isCreator: boolean;
  isBusiness: boolean;
  isVenue: boolean;
  isStar: boolean;
  isVisionary: boolean;
  isPro: boolean;
  isEnterprise: boolean;
  isCreatorTier: boolean;
  isPremiumEventUser: boolean;
  isPaid: boolean;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Boot instantly from the cached session, then confirm against the server.
  const [user, setUser] = useState<User | null>(() => sonicAuth.getStoredUser() as User | null);
  const [token, setToken] = useState<string | null>(() => sonicAuth.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(!!sonicAuth.getToken());

  useEffect(() => {
    let cancelled = false;

    // React to login/logout performed anywhere in the app.
    const unsubscribe = sonicAuth.onAuthChange((u) => {
      if (cancelled) return;
      setUser(u as User | null);
      setToken(sonicAuth.getToken());
      setIsLoading(false);
    });

    // Validate any stored session against the server exactly once at boot.
    (async () => {
      try {
        const u = await sonicAuth.fetchMe();
        if (!cancelled) {
          setUser(u as User | null);
          setToken(sonicAuth.getToken());
        }
      } catch {
        /* server unreachable — keep cached session so the app still renders */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const logout = async () => {
    sonicAuth.logout();
  };

  const refreshUser = async () => {
    try {
      const u = await sonicAuth.fetchMe();
      setUser(u as User | null);
      setToken(sonicAuth.getToken());
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const isAdmin = user?.userType === 'admin';
  const isArtist = user?.userType === 'artist';
  const isCreator = user?.userType === 'creator';
  const isBusiness = user?.userType === 'business';
  const isVenue = user?.userType === 'venue';
  const isVisionary = user?.subscriptionTier === 'visionary';
  const isPro = user?.subscriptionTier === 'pro';
  const isEnterprise = user?.subscriptionTier === 'enterprise';
  const isCreatorTier = user?.subscriptionTier === 'creator';
  const isStar = isCreatorTier; // creator tier replaces legacy star tier
  const isPaid = isCreatorTier || isVisionary || isPro || isEnterprise || isAdmin;
  const isPremiumEventUser = user?.isPremiumEventUser || isAdmin;

  const getIdToken = async (_forceRefresh = false) => {
    const t = sonicAuth.getToken();
    setToken(t);
    return t;
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, logout, refreshUser, getIdToken,
      isAdmin, isArtist, isCreator, isBusiness, isVenue, isStar, isVisionary, isPro, isEnterprise, isCreatorTier, isPremiumEventUser, isPaid
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

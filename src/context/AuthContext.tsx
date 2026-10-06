/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { api } from '../api';

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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          
          // Fetch user profile from backend API
          // The backend will automatically sync/create the user if it doesn't exist
          const profile = await api.user.getProfile();
          setUser(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const refreshUser = async () => {
    if (!auth.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      setToken(idToken);
      const profile = await api.user.getProfile();
      setUser(profile);
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

  const getIdToken = async (forceRefresh = false) => {
    if (!auth.currentUser) return null;
    const idToken = await auth.currentUser.getIdToken(forceRefresh);
    setToken(idToken);
    return idToken;
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

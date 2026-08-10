import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from './ui/Toast';
import { TrackProvider } from '../context/TrackContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TrackProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </TrackProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

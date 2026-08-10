import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';
import { TrackProvider } from '../../context/TrackContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { QueryProvider } from './QueryProvider';
import { UIProvider } from './UIProvider';
import { AnalyticsProvider } from './AnalyticsProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <AnalyticsProvider>
            <UIProvider>
              <ThemeProvider>
                <TrackProvider>
                  <CartProvider>
                    {children}
                  </CartProvider>
                </TrackProvider>
              </ThemeProvider>
            </UIProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}

import React from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';
import { TrackProvider } from '../../context/TrackContext';

export const DataProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <TrackProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </TrackProvider>
    </AuthProvider>
  );
};

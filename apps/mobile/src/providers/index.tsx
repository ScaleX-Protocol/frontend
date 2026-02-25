import '../../polyfills';
import React, { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// IMPORT DARI PACKAGE (Gunakan data tersentralisasi)
import { PRIVY_CONFIG } from '@scalex/config'; 
import { getStorage } from '../lib/mmkv';
import { initializeApiClients } from '../config/index';

// Samakan logic QueryClient dengan Web agar behavior caching identik
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('429') || error?.message?.includes('timeout')) return false;
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
    },
  },
});

// Inisialisasi Storage & API
try {
  getStorage();
  initializeApiClients();
} catch (error) {
  console.error('[Providers] Init error:', error);
}

export function Providers({ children }: { children: ReactNode }) {
  const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID || PRIVY_CONFIG.appId;
  const privyClientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;

  if (!privyAppId || !privyClientId) {
    throw new Error('[Privy] App ID dan Client ID wajib diisi di .env');
  }

  return (
    <PrivyProvider 
      appId={privyAppId} 
      clientId={privyClientId}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PrivyProvider>
  );
}
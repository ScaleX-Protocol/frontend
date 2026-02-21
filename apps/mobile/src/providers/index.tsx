// Import polyfills first
import '../polyfills';

import { PrivyProvider } from '@privy-io/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { initializeApiClients } from '../src/config/api';
import { getStorage } from '../src/lib/mmkv';

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
    },
  },
});

// Ensure MMKV is initialized before API clients
try {
  getStorage();
  console.log('[Providers] MMKV storage initialized successfully');
  // Initialize API clients on module load
  initializeApiClients();
} catch (error) {
  console.error('[Providers] Failed to initialize MMKV storage:', error);
  // API clients will still be initialized, but storage-dependent features may fail gracefully
  initializeApiClients();
}

export function Providers({ children }: { children: ReactNode }) {
  const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
  const privyClientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;

  if (!privyAppId) {
    throw new Error('[Privy] EXPO_PUBLIC_PRIVY_APP_ID is required. Please check your .env file.');
  }

  if (!privyClientId) {
    throw new Error('[Privy] EXPO_PUBLIC_PRIVY_CLIENT_ID is required. Please check your .env file.');
  }

  return (
    <PrivyProvider appId={privyAppId} clientId={privyClientId}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PrivyProvider>
  );
}

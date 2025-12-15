import { PrivyProvider } from '@privy-io/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { ReactNode } from 'react';

// Create Wagmi config for mobile
const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

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

export function PrivyProviders({ children }: { children: ReactNode }) {
  // TODO: Replace with actual Privy App ID from environment variable
  const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID || 'YOUR_PRIVY_APP_ID';

  return (
    <PrivyProvider
      appId={privyAppId}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

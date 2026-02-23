'use client';

import React, { useMemo } from 'react';
import { type PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { base } from 'viem/chains';

// IMPORT DARI PACKAGE
import { 
  SUPPORTED_EVM_CHAINS, 
  DEFAULT_EVM_CHAIN, 
  SUPPORTED_SOLANA_CLUSTERS 
} from '@scalex/config';

import { wagmiConfig } from '@/configs/wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('429') || error?.message?.includes('timeout')) return false;
        return failureCount < 1;
      },
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  const privyConfig: PrivyClientConfig = useMemo(() => ({
    embeddedWallets: {
      ethereum: { createOnLogin: 'all-users' },
      solana: { createOnLogin: 'all-users' },
    },
    // AMBIL DATA DARI PACKAGE @scalex/config
    supportedChains: SUPPORTED_EVM_CHAINS,
    defaultChain: DEFAULT_EVM_CHAIN,
    solanaClusters: SUPPORTED_SOLANA_CLUSTERS,

    loginMethods: ['google', 'twitter', 'email', 'wallet', 'farcaster'],
    appearance: {
      theme: 'dark',
      accentColor: '#FF6B00', // ScaleX Orange
      logo: '/images/logo/ScaleX.webp',
      walletList: ['phantom', 'base_account', 'coinbase_wallet', 'metamask', 'rabby_wallet'],
      showWalletLoginFirst: true
    },
  }), []);

  if (!privyAppId || privyAppId === 'your-privy-app-id') {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Check your .env for VITE_PRIVY_APP_ID
      </div>
    );
  }

  const PrivyProviderComponent = PrivyProvider as any;

  return (
    <PrivyProviderComponent appId={privyAppId} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <OnchainKitProvider apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY} chain={base}>
            <MiniKitProvider enabled>
              {children}
            </MiniKitProvider>
          </OnchainKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProviderComponent>
  );
}
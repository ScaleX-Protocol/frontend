'use client';

import React from 'react';
import { type PrivyClientConfig } from '@privy-io/react-auth';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { defineChain } from 'viem';
import { WagmiProvider } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { wagmiConfig } from '@/configs/wagmi';
import { ChainConfig } from '@/configs/chain';
import { base } from 'viem/chains';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
          return false;
        }

        if (error?.message?.includes('timeout') || error?.message?.includes('ERR_TIMED_OUT')) {
          return false;
        }

        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
    },
  },
});

// Define Mantle Sepolia testnet configuration
const mantleSepolia = {
  id: 5001,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: { name: 'MANTLE', symbol: 'MANTLE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.mantle.pub'] },
    public: { http: ['https://testnet.mantle.pub'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
} as const;

// Map chain IDs to viem chain objects
const getViemChain = (chainId: number) => {
  switch (chainId) {
    case 84532:
      return baseSepolia;
    case 5001:
      return mantleSepolia;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

const createPrivyConfig = (): PrivyClientConfig => {
  const baseConfig: PrivyClientConfig = {
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'all-users',
      },
    },
    loginMethods: ['google', 'twitter', 'email', 'wallet'],
    appearance: {
      theme: 'dark',
      accentColor: '#676FFF',
      logo: '/images/logo/ScaleX.webp',
      walletList: ['base_account','rabby_wallet','coinbase_wallet','phantom','metamask','rainbow','zerion','cryptocom','uniswap','okx_wallet','universal_profile'],
      showWalletLoginFirst: true
    },
  };

  // Get supported chains from chain config
  const supportedChains = ChainConfig.supportedChainIds.map(chainId =>
    defineChain(getViemChain(chainId))
  );

  // Get default chain from chain config
  const defaultChain = defineChain(getViemChain(ChainConfig.defaultChainId));

  return {
    ...baseConfig,
    defaultChain,
    supportedChains,
  };
};

const privyConfig = createPrivyConfig();

export function Providers({ children }: { children: ReactNode }) {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!privyAppId || privyAppId === 'your-privy-app-id') {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <OnchainKitProvider apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY} chain={base}>
            <MiniKitProvider enabled>
              {children}
            </MiniKitProvider>
          </OnchainKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  // Cast the PrivyProvider component to any to bypass type checking for now
  // This is a temporary solution for a library compatibility issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

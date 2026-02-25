'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { ChainTypeConfig } from '@/configs/chainType';
import { getSolanaConnectors } from '@/configs/solanaConnectors';
import { WorldMiniKitProvider } from './WorldMiniKitProvider';

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
      return baseSepolia; // Default to Base Sepolia
  }
};

/**
 * Create Privy config for EVM mode (original configuration)
 */
const createEVMPrivyConfig = (): PrivyClientConfig => {
  const baseConfig: PrivyClientConfig = {
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'all-users',
      },
    },
    loginMethods: ['google', 'twitter', 'email', 'wallet', 'farcaster'],
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

/**
 * Create Privy config for Solana mode
 */
const createSolanaPrivyConfig = (): PrivyClientConfig => {
  // Still need EVM chains for Privy initialization (required by Privy)
  const supportedChains = [defineChain(baseSepolia)];
  const defaultChain = defineChain(baseSepolia);

  return {
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'off',
      },
      solana: {
        createOnLogin: 'all-users',
      },
    },
    loginMethods: ['google', 'twitter', 'email', 'wallet', 'farcaster'],
    appearance: {
      theme: 'dark',
      accentColor: '#676FFF',
      logo: '/images/logo/ScaleX.webp',
      walletList: ['phantom', 'solflare', 'backpack'],
      showWalletLoginFirst: false,
      walletChainType: 'solana-only',
    },
    defaultChain,
    supportedChains,
  };
};

// Create config at module level for EVM mode (original behavior)
const evmPrivyConfig = createEVMPrivyConfig();

export function Providers({ children }: { children: ReactNode }) {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  // For Solana mode: Track client-side mounting to ensure browser extensions are loaded
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (ChainTypeConfig.isSolana) {
      setIsMounted(true);
    }
  }, []);

  // Build Privy config based on chain type
  const privyConfig = useMemo((): PrivyClientConfig => {
    // EVM mode: Use original config (no dynamic changes needed)
    if (ChainTypeConfig.isEVM) {
      return evmPrivyConfig;
    }

    // Solana mode: Need to wait for mount to detect browser extensions
    const config = createSolanaPrivyConfig();

    if (isMounted) {
      const solanaConnectors = getSolanaConnectors();
      return {
        ...config,
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      };
    }

    return config;
  }, [isMounted]);

  if (!privyAppId || privyAppId === 'your-privy-app-id') {
    return (
      <WorldMiniKitProvider>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
            <OnchainKitProvider apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY} chain={base}>
              <MiniKitProvider enabled>
                {children}
              </MiniKitProvider>
            </OnchainKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </WorldMiniKitProvider>
    );
  }

  // Cast the PrivyProvider component to any to bypass type checking for now
  // This is a temporary solution for a library compatibility issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PrivyProviderComponent = PrivyProvider as any;

  return (
    <WorldMiniKitProvider>
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
    </WorldMiniKitProvider>
  );
}

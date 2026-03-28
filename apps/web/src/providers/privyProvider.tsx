'use client';

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
import { SolanaConfig } from '@/configs/solana';
import { SolanaProviderConditional } from './SolanaProvider';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
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
      walletList: ['base_account', 'rabby_wallet', 'coinbase_wallet', 'phantom', 'metamask', 'rainbow', 'zerion', 'cryptocom', 'uniswap', 'okx_wallet', 'universal_profile'],
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
 * Based on official Privy docs: https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana
 *
 * Key differences from EVM:
 * - Uses createSolanaRpc() / createSolanaRpcSubscriptions() from @solana/kit
 * - Sets walletChainType: 'solana-only'
 * - Configures toSolanaWalletConnectors() for external wallet detection
 * - Disables EVM embedded wallet creation
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
    // Privy v3: Configure RPC endpoints for embedded Solana wallets
    // Must use createSolanaRpc() from @solana/kit, NOT plain strings
    //
    // Configure Privy RPC endpoints for embedded Solana wallets.
    // Use VITE_PRIVY_SOLANA_RPC_URL (public devnet) so Privy's ~10 wallet-init
    // calls per page load do NOT consume the Helius rate-limited quota.
    // Our SolanaProvider (app data queries) still uses VITE_SOLANA_RPC_URL (Helius).
    solana: {
      rpcs: {
        [SolanaConfig.chainId]: {
          rpc: createSolanaRpc(SolanaConfig.privyRpcUrl),
          rpcSubscriptions: createSolanaRpcSubscriptions(SolanaConfig.privyWsUrl),
        },
      },
    },
    loginMethods: ['google', 'twitter', 'email', 'wallet', 'farcaster'],
    appearance: {
      theme: 'dark',
      accentColor: '#676FFF',
      logo: '/images/logo/ScaleX-Logo.png',
      walletList: ['phantom', 'solflare', 'backpack'],
      showWalletLoginFirst: true,
      walletChainType: 'solana-only',
    },
    externalWallets: {
      solana: {
        connectors: getSolanaConnectors(),
      },
    },
    defaultChain,
    supportedChains,
  };
};

// Create configs at module level (must be stable before PrivyProvider mounts)
const evmPrivyConfig = createEVMPrivyConfig();
const solanaPrivyConfig = createSolanaPrivyConfig();

// Cast the PrivyProvider component to any to bypass type checking for now
// This is a temporary solution for a library compatibility issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PrivyProviderComponent = PrivyProvider as any;

/**
 * EVM Provider Stack
 * PrivyProvider → QueryClient → Wagmi → OnchainKit → MiniKit → children
 */
function EVMProviders({ children, privyAppId }: { children: ReactNode; privyAppId: string }) {
  return (
    <WorldMiniKitProvider>
      <PrivyProviderComponent appId={privyAppId} config={evmPrivyConfig}>
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

/**
 * Solana Provider Stack
 * WagmiProvider is kept to prevent crashes in shared components (useLogger, DepositModal, etc.)
 * that use Wagmi hooks. It's placed OUTSIDE PrivyProvider so it doesn't conflict with
 * Privy's walletChainType: 'solana-only' config.
 *
 * Stack: Wagmi → Privy → QueryClient → SolanaProvider → children
 */
function SolanaProviders({ children, privyAppId }: { children: ReactNode; privyAppId: string }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <PrivyProviderComponent appId={privyAppId} config={solanaPrivyConfig}>
        <QueryClientProvider client={queryClient}>
          <SolanaProviderConditional>
            {children}
          </SolanaProviderConditional>
        </QueryClientProvider>
      </PrivyProviderComponent>
    </WagmiProvider>
  );
}

/**
 * Fallback providers when no Privy App ID is configured (development)
 */
function FallbackProviders({ children }: { children: ReactNode }) {
  if (ChainTypeConfig.isSolana) {
    return (
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <SolanaProviderConditional>
            {children}
          </SolanaProviderConditional>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

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

export function Providers({ children }: { children: ReactNode }) {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!privyAppId || privyAppId === 'your-privy-app-id') {
    return <FallbackProviders>{children}</FallbackProviders>;
  }

  // Route to the correct provider stack based on chain type
  if (ChainTypeConfig.isSolana) {
    return <SolanaProviders privyAppId={privyAppId}>{children}</SolanaProviders>;
  }

  return <EVMProviders privyAppId={privyAppId}>{children}</EVMProviders>;
}

/**
 * Unified Wallet State Hook
 * Automatically delegates to EVM or Solana wallet hook based on environment
 */

import { ChainTypeConfig } from '@/configs/chainType';
import { useEVMWalletState } from './useEVMWalletState';
import { useSolanaWalletState } from './useSolanaWalletState';
import type { WalletStateReturn } from '@/types/wallet.types';

/**
 * Main wallet state hook
 * Automatically uses the correct implementation based on VITE_CHAIN_ID or VITE_SOLANA_CLUSTER
 *
 * - .env.base-sepolia (VITE_CHAIN_ID=84532) → EVM mode
 * - .env.solana (VITE_SOLANA_CLUSTER=devnet) → Solana mode
 */
export function useWalletState(): WalletStateReturn {
  // Determine which hook to use based on environment
  // This is evaluated at build time, so only one path is included in the bundle
  if (ChainTypeConfig.isSolana) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSolanaWalletState();
  }

  // Default: EVM mode
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useEVMWalletState();
}

// Re-export types for convenience
export type { WalletStateReturn } from '@/types/wallet.types';

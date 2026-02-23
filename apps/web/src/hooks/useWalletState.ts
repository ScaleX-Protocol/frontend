/**
 * Unified Wallet State Hook
 * Automatically delegates to EVM or Solana wallet hook based on environment
 */

import { ChainTypeConfig } from '@/configs/chainType';
import { useEVMWalletState } from './useEVMWalletState';
import { useSVMWalletState } from './svm/useSVMWalletState';
import type { WalletStateReturn } from '@/types/wallet.types';

/**
 * Main wallet state hook
 * Automatically uses the correct implementation based on VITE_CHAIN_TYPE
 *
 * - .env.base-sepolia (VITE_CHAIN_TYPE=evm)    → EVM mode (useEVMWalletState)
 * - .env.solana       (VITE_CHAIN_TYPE=solana)  → Solana mode (useSVMWalletState)
 */
export function useWalletState(): WalletStateReturn {
  // Determine which hook to use based on environment
  // This is evaluated at build time, so only one path is included in the bundle
  if (ChainTypeConfig.isSolana) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSVMWalletState();
  }

  // Default: EVM mode
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useEVMWalletState();
}

// Re-export types for convenience
export type { WalletStateReturn } from '@/types/wallet.types';

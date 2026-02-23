/**
 * SVM (Solana) Wallet State Hook - Privy v3 Implementation
 *
 * Uses Privy v3 Solana-specific hooks from '@privy-io/react-auth/solana'.
 * Implements the Dual Wallet Pattern:
 * - embeddedSolanaWallet: Privy-created wallet for seamless trading
 * - externalSolanaWallet: User's external wallet (Phantom, Solflare, etc.) for deposits
 *
 * @see Official Privy docs: https://docs.privy.io/recipes/solana/getting-started-with-privy-and-solana
 * @see WALLET_SHEET_FLOW.md for Dual Wallet Pattern details
 */

import { usePrivy } from '@privy-io/react-auth';
// Official Privy v3 Solana hooks — requires Solana provider stack (no WagmiProvider)
import { useWallets, useExportWallet } from '@privy-io/react-auth/solana';
import { useCallback, useMemo } from 'react';
import type { WalletInfo, SolanaWalletInfo, WalletStateReturn } from '@/types/wallet.types';
import { SolanaConfig } from '@/configs/solana';

// Stub EVM wallet for Solana mode
const STUB_EVM_WALLET: WalletInfo = {
  wallet: undefined,
  address: 'EVM Disabled',
  chainId: 0,
  validation: { isValid: false, needsSwitch: false },
};

/**
 * useSVMWalletState - Solana wallet state using Privy v3 hooks
 *
 * Uses official Privy Solana API:
 * - useWallets() from '@privy-io/react-auth/solana' → returns Solana wallets only
 * - useExportWallet() from '@privy-io/react-auth/solana' → Solana-specific export
 * - Finds embedded wallet via w.standardWallet.name === 'Privy' (official pattern)
 *
 * @returns WalletStateReturn - Unified wallet state interface
 */
export function useSVMWalletState(): WalletStateReturn {
  // Privy auth state
  const { user, authenticated, login, logout, ready: privyReady } = usePrivy();

  // Privy v3: Solana-specific export wallet function
  const { exportWallet } = useExportWallet();

  // Privy v3: useWallets from /solana returns only Solana wallets
  const { wallets, ready: walletsReady } = useWallets();

  // Find embedded Solana wallet (Privy-created)
  // Official pattern: w.standardWallet.name === 'Privy'
  const embeddedWalletInstance = useMemo(() => {
    return wallets.find((w) => w.standardWallet.name === 'Privy');
  }, [wallets]);

  // Find external Solana wallet (Phantom, Solflare, Backpack, etc.)
  // Any wallet where standardWallet.name !== 'Privy' is external
  const externalWalletInstance = useMemo(() => {
    // Build set of allowed addresses from linked accounts
    const allowedAddresses = new Set<string>();

    if (user) {
      // Add main wallet if exists
      if (user.wallet?.address) {
        // CRITICAL: Solana uses Base58 encoding which is case-sensitive!
        // Unlike EVM hex addresses, toLowerCase() would corrupt the address
        allowedAddresses.add(user.wallet.address);
      }

      // Add all linked Solana wallets
      user.linkedAccounts.forEach((account) => {
        if (
          account.type === 'wallet' &&
          (account as { chainType?: string }).chainType === 'solana' &&
          account.address
        ) {
          // CRITICAL: No toLowerCase() — Base58 is case-sensitive
          allowedAddresses.add(account.address);
        }
      });
    }

    return wallets.find((w) => {
      // Must NOT be embedded (Privy) wallet
      if (w.standardWallet.name === 'Privy') return false;

      // Must be authenticated
      if (!authenticated || !user) return false;

      // Must be a linked wallet address
      // Case-sensitive match for Base58 Solana addresses
      return allowedAddresses.has(w.address);
    });
  }, [wallets, user, authenticated]);

  // Build embedded Solana wallet info
  const embeddedSolanaWallet: SolanaWalletInfo = useMemo(
    () => ({
      wallet: embeddedWalletInstance,
      address: embeddedWalletInstance?.address || 'Not Created',
      chainId: SolanaConfig.chainId,
    }),
    [embeddedWalletInstance]
  );

  // Build external Solana wallet info
  const externalSolanaWallet: SolanaWalletInfo = useMemo(
    () => ({
      wallet: externalWalletInstance,
      address: externalWalletInstance?.address || 'Not Connected',
      chainId: SolanaConfig.chainId,
    }),
    [externalWalletInstance]
  );

  // Connection state - connected if we have at least the embedded wallet
  const isConnected = authenticated && embeddedSolanaWallet.address !== 'Not Created';

  // Validation functions - Solana doesn't need chain validation like EVM
  // Kept for interface compatibility
  const validateEmbeddedChain = useCallback(async () => true, []);
  const validateExternalChain = useCallback(async () => true, []);
  const validateAllChains = useCallback(async () => { }, []);

  return {
    isConnected,
    isReady: privyReady && walletsReady,

    // EVM wallets (stub in Solana mode)
    embeddedWallet: STUB_EVM_WALLET,
    externalWallet: STUB_EVM_WALLET,

    // Solana wallets (primary in Solana mode)
    embeddedSolanaWallet,
    externalSolanaWallet,

    // Auth functions
    login,
    logout,
    export: exportWallet,

    // Validation (no-op for Solana)
    validateEmbeddedChain,
    validateExternalChain,
    validateAllChains,
  };
}

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
import { ChainConfig } from '@/configs/chain';

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
        allowedAddresses.add(user.wallet.address);
      }

      // Add all linked Solana wallets
      user.linkedAccounts.forEach((account) => {
        if (
          account.type === 'wallet' &&
          (account as { chainType?: string }).chainType === 'solana' &&
          account.address
        ) {
          allowedAddresses.add(account.address);
        }
      });
    }

    // DEBUG: log raw wallet/user state to diagnose external wallet detection
    console.group('[wallet trace][useSVMWalletState] External wallet detection');
    console.log('authenticated:', authenticated);
    console.log('user.wallet:', user?.wallet);
    console.log(
      'linkedAccounts (all):',
      user?.linkedAccounts.map((a) => ({
        type: a.type,
        chainType: (a as { chainType?: string }).chainType,
        address: (a as { address?: string }).address,
      })),
    );
    console.log(
      'wallets from useWallets():',
      wallets.map((w) => ({ name: w.standardWallet.name, address: w.address })),
    );
    console.log('allowedAddresses:', [...allowedAddresses]);
    const found = wallets.find((w) => {
      if (w.standardWallet.name === 'Privy') return false;
      if (!authenticated || !user) return false;
      return allowedAddresses.has(w.address);
    });
    console.log('externalWalletInstance found:', found?.address ?? 'NOT FOUND');
    console.groupEnd();

    return found;
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

  // Build UNIFIED wallet fields — map Solana addresses into EVM-shaped interface
  // This is the key: consumers call wallet.embeddedWallet.address and get the
  // correct Solana pubkey without needing ChainTypeConfig checks.
  const defaultValidation = useMemo(() => ({
    isValid: true,
    needsSwitch: false,
  }), []);

  const embeddedWallet: WalletInfo = useMemo(
    () => ({
      wallet: undefined,
      address: embeddedSolanaWallet.address, // Solana pubkey mapped here
      chainId: ChainConfig.defaultChainId,
      validation: defaultValidation,
    }),
    [embeddedSolanaWallet.address, defaultValidation]
  );

  const externalWallet: WalletInfo = useMemo(
    () => ({
      wallet: undefined,
      address: externalSolanaWallet.address, // Solana pubkey mapped here
      chainId: ChainConfig.defaultChainId,
      validation: defaultValidation,
    }),
    [externalSolanaWallet.address, defaultValidation]
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

    // Unified wallet fields — Solana addresses mapped for consumer compatibility
    embeddedWallet,
    externalWallet,

    // Solana-specific wallet fields — available for Solana-only logic
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

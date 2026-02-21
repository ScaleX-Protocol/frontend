/**
 * EVM Wallet State Hook
 * Original implementation for EVM chains (Base Sepolia, Mantle Sepolia, etc.)
 * This is the exact original logic before Solana integration
 */

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';
import { baseSepolia } from 'viem/chains';
import { parseChainId } from '@/lib/wallet.helper';
import type { WalletInfo, SolanaWalletInfo, WalletStateReturn } from '@/types/wallet.types';
// import { useChainValidator } from './useChainValidator';
import { logger } from '@/utils/prodLogger';

const DEFAULT_EMBEDDED_CHAIN_ID = baseSepolia.id;
const DEFAULT_EXTERNAL_CHAIN_ID = baseSepolia.id;

// Stub Solana wallet for EVM mode (not used)
const STUB_SOLANA_WALLET: SolanaWalletInfo = {
  wallet: undefined,
  address: 'Solana Disabled',
  chainId: 'solana:devnet',
};

export function useEVMWalletState(): WalletStateReturn {
  const { wallets, ready } = useWallets();
  const { user, authenticated, login, logout, exportWallet, ready: privyReady } = usePrivy();

  // Memoize wallet selections
  const embeddedWalletInstance = useMemo(() => {
    return wallets.find((w) => w.walletClientType === 'privy');
  }, [wallets]);

  const externalWalletInstance = useMemo(() => {
    // Determine the set of allowed addresses from linked accounts and the main wallet.
    // We normalize to lowercase for case-insensitive comparison.
    const allowedAddresses = new Set<string>();
    if (user) {
      if (user.wallet?.address) {
        allowedAddresses.add(user.wallet.address.toLowerCase());
      }
      user.linkedAccounts.forEach((account) => {
        if (account.type === 'wallet' && account.address) {
          allowedAddresses.add(account.address.toLowerCase());
        }
      });
    }

    return wallets.find((w) => {
      // Must not be a privy wallet
      if (w.walletClientType === 'privy') return false;

      // If user is not authenticated, we don't show any external wallet info
      if (!authenticated || !user) return false;

      // Only return the wallet if its address is explicitly linked/connected to the user
      return allowedAddresses.has(w.address.toLowerCase());
    });
  }, [wallets, user, authenticated]);

  // TEMPORARILY DISABLED: Chain validation calls wagmi hooks before WagmiProvider is ready
  // This was causing WagmiProviderNotFoundError in production
  // const embeddedChainValidator = useChainValidator(embeddedWalletInstance);
  // const externalChainValidator = useChainValidator(externalWalletInstance);

  // Provide default validation results until we refactor the architecture
  const defaultValidationResult = useMemo(() => ({
    isValid: true,
    needsSwitch: false,
  }), []);

  // Memoize wallet info objects
  const embeddedWallet: WalletInfo = useMemo(
    () => ({
      wallet: embeddedWalletInstance,
      address: embeddedWalletInstance?.address || 'Not Created',
      chainId: parseChainId(embeddedWalletInstance?.chainId) || DEFAULT_EMBEDDED_CHAIN_ID,
      validation: defaultValidationResult,
    }),
    [embeddedWalletInstance, defaultValidationResult],
  );

  const externalWallet: WalletInfo = useMemo(
    () => ({
      wallet: externalWalletInstance,
      address: externalWalletInstance?.address || 'Not Connected',
      chainId: parseChainId(externalWalletInstance?.chainId) || DEFAULT_EXTERNAL_CHAIN_ID,
      validation: defaultValidationResult,
    }),
    [externalWalletInstance, defaultValidationResult],
  );

  const isConnected = authenticated && embeddedWallet.address !== 'Not Created';

  // TEMPORARILY DISABLED: Validation functions
  const validateEmbeddedChain = useCallback(async () => {
    // TEMPORARILY DISABLED: Chain validation
    return true;
  }, []);

  const validateExternalChain = useCallback(async () => {
    // TEMPORARILY DISABLED: Chain validation
    return true;
  }, []);

  const validateAllChains = useCallback(async () => {
    // TEMPORARILY DISABLED: Chain validation
  }, []);

  return {
    isConnected,
    isReady: ready && privyReady,
    // EVM wallets (primary in EVM mode)
    embeddedWallet,
    externalWallet,
    // Solana wallets (stub in EVM mode)
    embeddedSolanaWallet: STUB_SOLANA_WALLET,
    externalSolanaWallet: STUB_SOLANA_WALLET,
    // Auth functions
    login,
    logout,
    export: exportWallet,
    // Validation
    validateEmbeddedChain,
    validateExternalChain,
    validateAllChains,
  };
}

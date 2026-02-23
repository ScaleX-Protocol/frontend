/**
 * Unified Wallet State Hook
 * Supports both EVM and Solana modes based on VITE_CHAIN_TYPE environment variable
 *
 * This is the canonical wallet state hook for all ScaleX apps.
 * Chain behavior is determined dynamically — no code changes needed per chain.
 *
 * - VITE_CHAIN_TYPE=evm    → EVM mode (useEVMWalletState)
 * - VITE_CHAIN_TYPE=solana → Solana mode (useSolanaWalletState)
 */

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';
import { baseSepolia } from 'viem/chains';
import { parseChainId } from '../utils/wallet.helper';
import { ChainTypeConfig } from '../configs/chainType';
import { useSolanaWalletState } from './useSolanaWalletState';
import type { WalletInfo, SolanaWalletInfo, WalletStateReturn } from '@scalex/types';

const DEFAULT_EMBEDDED_CHAIN_ID = baseSepolia.id;
const DEFAULT_EXTERNAL_CHAIN_ID = baseSepolia.id;

// Stub Solana wallet for EVM mode
const STUB_SOLANA_WALLET: SolanaWalletInfo = {
  wallet: undefined,
  address: 'Solana Disabled',
  chainId: 'solana:devnet',
};

/**
 * EVM wallet state implementation (original logic)
 */
function useEVMWalletState(): WalletStateReturn {
  const { wallets, ready } = useWallets();
  const { user, authenticated, login, logout, exportWallet, ready: privyReady } = usePrivy();

  const embeddedWalletInstance = useMemo(() => {
    return wallets.find((w) => w.walletClientType === 'privy');
  }, [wallets]);

  const externalWalletInstance = useMemo(() => {
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
      if (w.walletClientType === 'privy') return false;
      if (!authenticated || !user) return false;
      return allowedAddresses.has(w.address.toLowerCase());
    });
  }, [wallets, user, authenticated]);

  const defaultValidationResult = useMemo(() => ({
    isValid: true,
    needsSwitch: false,
  }), []);

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

  const validateEmbeddedChain = useCallback(async () => true, []);
  const validateExternalChain = useCallback(async () => true, []);
  const validateAllChains = useCallback(async () => { }, []);

  return {
    isConnected,
    isReady: ready && privyReady,
    embeddedWallet,
    externalWallet,
    embeddedSolanaWallet: STUB_SOLANA_WALLET,
    externalSolanaWallet: STUB_SOLANA_WALLET,
    login,
    logout,
    export: exportWallet,
    validateEmbeddedChain,
    validateExternalChain,
    validateAllChains,
  };
}

/**
 * Main unified wallet state hook
 * Automatically routes to EVM or Solana implementation based on VITE_CHAIN_TYPE
 *
 * All apps import this from '@scalex/service-wallet' — no local overrides needed.
 */
export function useWalletState(): WalletStateReturn {
  if (ChainTypeConfig.isSolana) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSolanaWalletState();
  }

  // Default: EVM mode
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useEVMWalletState();
}

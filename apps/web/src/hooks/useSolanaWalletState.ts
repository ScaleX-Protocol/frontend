/**
 * Solana Wallet State Hook
 * Handles Solana wallet connections via Privy (Phantom, Solflare, Backpack, etc.)
 */

import { usePrivy, useWallets, type ConnectedWallet } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';
import type { WalletInfo, SolanaWalletInfo, WalletStateReturn } from '@/types/wallet.types';

interface SolanaWallet extends ConnectedWallet {
  chainType: string;
}

const DEFAULT_SOLANA_CHAIN_ID = 'solana:devnet';

// Stub EVM wallet for Solana mode (not used)
const STUB_EVM_WALLET: WalletInfo = {
  wallet: undefined,
  address: 'EVM Disabled',
  chainId: 0,
  validation: { isValid: false, needsSwitch: false },
};

export function useSolanaWalletState(): WalletStateReturn {
  const { user, authenticated, login, logout, exportWallet, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  // Find Solana wallet from useWallets hook (filter by chainType)
  const solanaWalletFromHook = useMemo(() => {
    return (wallets as SolanaWallet[]).find((w) => w.chainType === 'solana');
  }, [wallets]);

  // Fallback: Get Solana wallet from user's linkedAccounts
  const solanaWalletFromUser = useMemo(() => {
    return user?.linkedAccounts.find(
      (account) => account.type === 'wallet' && (account as { chainType?: string }).chainType === 'solana'
    ) as { address?: string } | undefined;
  }, [user]);

  // Combined: Prefer hook wallet, fallback to user account
  const solanaAddress = solanaWalletFromHook?.address || solanaWalletFromUser?.address;

  // Detect if wallet is embedded (Privy) or external (Phantom, etc.)
  const isEmbeddedWallet = useMemo(() => {
    if (!solanaWalletFromHook) return false;
    return solanaWalletFromHook.walletClientType === 'privy';
  }, [solanaWalletFromHook]);

  // Solana wallet info objects
  const embeddedSolanaWallet: SolanaWalletInfo = useMemo(
    () => ({
      wallet: isEmbeddedWallet ? solanaWalletFromHook : undefined,
      address: isEmbeddedWallet ? (solanaAddress || 'Not Created') : 'Not Created',
      chainId: DEFAULT_SOLANA_CHAIN_ID,
    }),
    [solanaWalletFromHook, solanaAddress, isEmbeddedWallet]
  );

  const externalSolanaWallet: SolanaWalletInfo = useMemo(
    () => ({
      wallet: !isEmbeddedWallet ? solanaWalletFromHook : undefined,
      address: !isEmbeddedWallet ? (solanaAddress || 'Not Connected') : 'Not Connected',
      chainId: DEFAULT_SOLANA_CHAIN_ID,
    }),
    [solanaWalletFromHook, solanaAddress, isEmbeddedWallet]
  );

  // isConnected checks if we have a Solana wallet address
  const isConnected = authenticated && !!solanaAddress;

  // Validation functions (not needed for Solana, kept for interface compatibility)
  const validateEmbeddedChain = useCallback(async () => true, []);
  const validateExternalChain = useCallback(async () => true, []);
  const validateAllChains = useCallback(async () => {}, []);

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
    // Validation
    validateEmbeddedChain,
    validateExternalChain,
    validateAllChains,
  };
}

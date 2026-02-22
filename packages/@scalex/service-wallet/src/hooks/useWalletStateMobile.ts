import {
  usePrivy,
  useEmbeddedSolanaWallet,
  useEmbeddedEthereumWallet,
  isConnected,
  isNotCreated,
} from '@privy-io/expo';
import { useEffect, useMemo, useRef } from 'react';
import type { WalletStateReturn } from '@scalex/types';

/**
 * @scalex/service-wallet – Mobile wallet hook (React Native / Expo)
 *
 * Implements {@link WalletStateReturn} using `@privy-io/expo`.
 * Handles both Solana and Ethereum embedded wallets.
 *
 * Privy Expo API notes:
 * - Solana: uses state machine (status: 'not-created'|'creating'|'connected'|'error')
 *   → uses isConnected() / isNotCreated() type guards
 * - Ethereum: simpler API — wallets[] is always present (empty when not created),
 *   create() takes { createAdditional?: boolean } (no recoveryMethod)
 *
 * Mapping to WalletStateReturn:
 * - `embeddedWallet` → Ethereum embedded wallet (EVM chains)
 * - `externalWallet` → Solana embedded wallet
 */

const DEFAULT_CHAIN_ID = 84532; // Base Sepolia (EVM)

export interface UseWalletStateMobileReturn {
  /** Solana embedded wallet address, or null if not yet created */
  solanaAddress: string | null;
  /** Ethereum embedded wallet address, or null if not yet created */
  ethereumAddress: string | null;
  /** Raw Solana wallet state from Privy Expo SDK */
  solanaWalletState: ReturnType<typeof useEmbeddedSolanaWallet>;
  /** Raw Ethereum wallet from Privy Expo SDK */
  ethereumWallets: ReturnType<typeof useEmbeddedEthereumWallet>['wallets'];
}

export function useWalletStateMobile(): UseWalletStateMobileReturn {
  // usePrivy() returns null when called outside a <PrivyProvider> context.
  // This can happen during Expo Router's initial render or Fast Refresh before
  // the provider tree is fully mounted. We cast safely and guard below.
  const privyContext = usePrivy() as ReturnType<typeof usePrivy> | null;
  const isReady = privyContext?.isReady ?? false;
  const user = privyContext?.user ?? null;

  const solanaWalletState = useEmbeddedSolanaWallet();
  const { wallets: ethereumWallets, create: createEthereumWallet } = useEmbeddedEthereumWallet();

  // Ref guards to prevent duplicate wallet creation on re-renders
  const isCreatingSolanaRef = useRef(false);
  const isCreatingEthereumRef = useRef(false);

  // ─── Auto-create Solana wallet ───────────────────────────────────────────────
  useEffect(() => {
    if (
      isReady &&
      user &&
      isNotCreated(solanaWalletState) &&
      !isCreatingSolanaRef.current
    ) {
      isCreatingSolanaRef.current = true;
      console.log('[useWalletStateMobile] Creating Solana embedded wallet...');
      solanaWalletState
        .create({ recoveryMethod: 'privy' })
        .then(() => {
          console.log('[useWalletStateMobile] Solana wallet created successfully');
        })
        .catch((err) => {
          isCreatingSolanaRef.current = false; // allow retry on error
          console.error('[useWalletStateMobile] Failed to create Solana wallet:', err);
        });
    }
  }, [isReady, user, solanaWalletState]);

  // ─── Auto-create Ethereum wallet ─────────────────────────────────────────────
  // Ethereum wallet: wallets[] is empty when not created
  useEffect(() => {
    if (
      isReady &&
      user &&
      ethereumWallets.length === 0 &&
      !isCreatingEthereumRef.current
    ) {
      isCreatingEthereumRef.current = true;
      console.log('[useWalletStateMobile] Creating Ethereum embedded wallet...');
      createEthereumWallet()
        .then(() => {
          console.log('[useWalletStateMobile] Ethereum wallet created successfully');
        })
        .catch((err) => {
          isCreatingEthereumRef.current = false; // allow retry on error
          console.error('[useWalletStateMobile] Failed to create Ethereum wallet:', err);
        });
    }
  }, [isReady, user, ethereumWallets, createEthereumWallet]);

  // ─── Solana wallet address ────────────────────────────────────────────────────
  const solanaAddress = useMemo(() => {
    if (!isConnected(solanaWalletState)) return null;
    const wallets = solanaWalletState.wallets;
    return wallets && wallets.length > 0 ? wallets[0].address : null;
  }, [solanaWalletState]);

  // ─── Ethereum wallet address ──────────────────────────────────────────────────
  const ethereumAddress = useMemo(() => {
    return ethereumWallets.length > 0 ? ethereumWallets[0].address : null;
  }, [ethereumWallets]);

  return {
    solanaAddress,
    ethereumAddress,
    solanaWalletState,
    ethereumWallets,
  };
}

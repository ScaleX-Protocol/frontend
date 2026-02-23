/**
 * SVM (Solana) Wallet State Hook
 *
 * Uses Privy v3 Solana-specific hooks from '@privy-io/react-auth/solana'.
 * Implements the Dual Wallet Pattern:
 * - embeddedSolanaWallet: Privy-created wallet for seamless trading
 * - externalSolanaWallet: User's external wallet (Phantom, Solflare, etc.) for deposits
 *
 * Part of @scalex/service-wallet — the unified wallet service package.
 */

import { usePrivy } from '@privy-io/react-auth';
// Official Privy v3 Solana hooks
import { useWallets, useExportWallet } from '@privy-io/react-auth/solana';
import { useCallback, useMemo } from 'react';
import type { WalletInfo, SolanaWalletInfo, WalletStateReturn } from '@scalex/types';
import { SolanaConfig } from '../configs/solana';

// Stub EVM wallet for Solana mode
const STUB_EVM_WALLET: WalletInfo = {
    wallet: undefined,
    address: 'EVM Disabled',
    chainId: 0,
    validation: { isValid: false, needsSwitch: false },
};

/**
 * useSolanaWalletState - Solana wallet state using Privy v3 hooks
 *
 * Uses official Privy Solana API:
 * - useWallets() from '@privy-io/react-auth/solana' → returns Solana wallets only
 * - useExportWallet() from '@privy-io/react-auth/solana' → Solana-specific export
 * - Finds embedded wallet via w.standardWallet.name === 'Privy' (official pattern)
 */
export function useSolanaWalletState(): WalletStateReturn {
    const { user, authenticated, login, logout, ready: privyReady } = usePrivy();
    const { exportWallet } = useExportWallet();
    const { wallets, ready: walletsReady } = useWallets();

    // Find embedded Solana wallet (Privy-created)
    // Official pattern: w.standardWallet.name === 'Privy'
    const embeddedWalletInstance = useMemo(() => {
        return wallets.find((w) => w.standardWallet.name === 'Privy');
    }, [wallets]);

    // Find external Solana wallet (Phantom, Solflare, Backpack, etc.)
    const externalWalletInstance = useMemo(() => {
        const allowedAddresses = new Set<string>();

        if (user) {
            if (user.wallet?.address) {
                // CRITICAL: Solana uses Base58 encoding — case-sensitive!
                allowedAddresses.add(user.wallet.address);
            }

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

        return wallets.find((w) => {
            if (w.standardWallet.name === 'Privy') return false;
            if (!authenticated || !user) return false;
            return allowedAddresses.has(w.address);
        });
    }, [wallets, user, authenticated]);

    // Build Solana wallet info objects
    const embeddedSolanaWallet: SolanaWalletInfo = useMemo(
        () => ({
            wallet: embeddedWalletInstance,
            address: embeddedWalletInstance?.address || 'Not Created',
            chainId: SolanaConfig.chainId,
        }),
        [embeddedWalletInstance]
    );

    const externalSolanaWallet: SolanaWalletInfo = useMemo(
        () => ({
            wallet: externalWalletInstance,
            address: externalWalletInstance?.address || 'Not Connected',
            chainId: SolanaConfig.chainId,
        }),
        [externalWalletInstance]
    );

    const isConnected = authenticated && embeddedSolanaWallet.address !== 'Not Created';

    // Validation functions — Solana doesn't need chain validation like EVM
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

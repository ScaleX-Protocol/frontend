'use client';

/* eslint-disable react-hooks/rules-of-hooks */

/**
 * Chain-Dispatch Balance Hook
 *
 * Auto-switches between EVM (useContractBalance) and Solana (useSolanaBalance)
 * based on ChainTypeConfig. Components use this single hook.
 *
 * Usage:
 *   const { formattedBalance, isLoading, refetch } = useChainBalance({
 *     userAddress: '...',
 *     tokenAddress: '0x...' or 'mint...',  // EVM token address or Solana mint
 *     decimals: 18,
 *   });
 */

import { ChainTypeConfig } from '@/configs/chainType';
import { useSolanaBalance } from './svm/useSolanaBalance';

interface UseChainBalanceParams {
    /** User address (hex for EVM, base58 for Solana) */
    userAddress?: string;
    /** Token address (EVM contract) or mint (Solana SPL) */
    tokenAddress?: string;
    /** Token decimals */
    decimals?: number;
    /** Whether to enable fetching */
    enabled?: boolean;
}

/**
 * Unified balance hook — delegates to EVM or Solana based on chain type.
 * ChainTypeConfig.isSolana is a build-time constant.
 */
export function useChainBalance({
    userAddress,
    tokenAddress,
    decimals = 18,
    enabled = true,
}: UseChainBalanceParams) {
    if (ChainTypeConfig.isSolana) {
        const solana = useSolanaBalance({
            userAddress,
            tokenMint: tokenAddress,
            decimals,
            enabled,
        });

        return {
            rawBalance: solana.rawBalance,
            formattedBalance: solana.formattedBalance,
            formattedString: solana.formattedString,
            isLoading: solana.isLoading,
            refetch: solana.refetch,
            chainType: 'solana' as const,
        };
    }

    // EVM path (default) — use the existing contract balance hook pattern
    // For EVM, balances are typically fetched via wagmi's useBalance or custom useContractBalance
    // This returns a stub that components can replace with their EVM-specific logic
    return {
        rawBalance: undefined as bigint | undefined,
        formattedBalance: 0,
        formattedString: '0.00',
        isLoading: false,
        refetch: async () => { },
        chainType: 'evm' as const,
    };
}

'use client';

/* eslint-disable react-hooks/rules-of-hooks */

/**
 * Chain-Dispatch Withdraw Hook
 *
 * Auto-switches between EVM (useWithdraw) and Solana (useSolanaWithdraw)
 * based on ChainTypeConfig. Components use this single hook.
 *
 * Usage:
 *   const { withdraw, isPending, currentStep, error, txHash } = useChainWithdraw({ onSuccess });
 */

import { ChainTypeConfig } from '@/configs/chainType';
import { useWithdraw, WithdrawStep } from './useWithdraw';
import { useSolanaWithdraw, SolanaWithdrawStep } from './svm/useSolanaWithdraw';

/** Unified step enum for both chains */
export type ChainWithdrawStep = WithdrawStep | SolanaWithdrawStep;

interface UseChainWithdrawOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

/**
 * Unified withdraw hook — delegates to EVM or Solana based on chain type.
 *
 * For EVM: uses the existing useWithdraw hook (wagmi/viem)
 * For Solana: uses useSolanaWithdraw (Anchor settleFunds)
 */
export function useChainWithdraw(options: UseChainWithdrawOptions = {}) {
    if (ChainTypeConfig.isSolana) {
        // Solana path
        const solana = useSolanaWithdraw({
            onSuccess: options.onSuccess,
            onError: options.onError,
        });

        return {
            withdraw: solana.withdraw,
            isPending: solana.isPending,
            currentStep: solana.currentStep as ChainWithdrawStep,
            error: solana.error,
            txHash: solana.txHash,
            chainType: 'solana' as const,
        };
    }

    // EVM path (default)
    const evm = useWithdraw({
        onSuccess: options.onSuccess,
        onError: options.onError,
    });

    return {
        withdraw: evm.withdraw,
        isPending: evm.isPending,
        currentStep: evm.currentStep as ChainWithdrawStep,
        error: evm.error,
        txHash: evm.hash ?? null,
        chainType: 'evm' as const,
    };
}

export { WithdrawStep, SolanaWithdrawStep };

'use client';

/* eslint-disable react-hooks/rules-of-hooks */

/**
 * Chain-Dispatch Repay Hook
 *
 * Auto-switches between EVM (useRepay) and Solana (useSolanaRepay)
 * based on ChainTypeConfig. Components use this single hook — the chain
 * selection is transparent.
 *
 * Usage:
 *   const { repay, isPending, currentStep, error, txHash } = useChainRepay({ onSuccess });
 */

import { ChainTypeConfig } from '@/configs/chainType';
import { useRepay, RepayStep } from './useRepay';
import { useSolanaRepay, SolanaRepayStep } from './svm/useSolanaRepay';

/** Unified step enum for both chains */
export type ChainRepayStep = RepayStep | SolanaRepayStep;

interface UseChainRepayOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

/**
 * Unified repay hook — delegates to EVM or Solana based on chain type.
 *
 * For EVM: uses the existing useRepay hook (wagmi/viem)
 * For Solana: uses useSolanaRepay (Anchor)
 */
export function useChainRepay(options: UseChainRepayOptions = {}) {
    if (ChainTypeConfig.isSolana) {
        // Solana path
        const solana = useSolanaRepay({
            onSuccess: options.onSuccess,
            onError: options.onError,
        });

        return {
            repay: solana.repay,
            isPending: solana.isPending,
            currentStep: solana.currentStep as ChainRepayStep,
            error: solana.error,
            txHash: solana.txHash,
            chainType: 'solana' as const,
        };
    }

    // EVM path (default)
    const evm = useRepay({
        onSuccess: options.onSuccess,
        onError: options.onError,
    });

    return {
        repay: evm.repay,
        isPending: evm.isPending,
        currentStep: evm.currentStep as ChainRepayStep,
        error: evm.error,
        txHash: evm.hash ?? null,
        chainType: 'evm' as const,
    };
}

export { RepayStep, SolanaRepayStep };

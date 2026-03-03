'use client';

/* eslint-disable react-hooks/rules-of-hooks */

/**
 * Chain-Dispatch Borrow Hook
 *
 * Auto-switches between EVM (useBorrow) and Solana (useSolanaBorrow)
 * based on ChainTypeConfig. Components use this single hook — the chain
 * selection is transparent.
 *
 * Usage:
 *   const { borrow, isPending, currentStep, error, txHash } = useChainBorrow({ onSuccess });
 */

import { ChainTypeConfig } from '@/configs/chainType';
import { useBorrow, BorrowStep } from './useBorrow';
import { useSolanaBorrow, SolanaBorrowStep } from './svm/useSolanaBorrow';

/** Unified step enum for both chains */
export type ChainBorrowStep = BorrowStep | SolanaBorrowStep;

interface UseChainBorrowOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

/**
 * Unified borrow hook — delegates to EVM or Solana based on chain type.
 *
 * For EVM: uses the existing useBorrow hook (wagmi/viem)
 * For Solana: uses useSolanaBorrow (Anchor)
 */
export function useChainBorrow(options: UseChainBorrowOptions = {}) {
    if (ChainTypeConfig.isSolana) {
        // Solana path
        const solana = useSolanaBorrow({
            onSuccess: options.onSuccess,
            onError: options.onError,
        });

        return {
            borrow: solana.borrow,
            isPending: solana.isPending,
            currentStep: solana.currentStep as ChainBorrowStep,
            error: solana.error,
            txHash: solana.txHash,
            chainType: 'solana' as const,
        };
    }

    // EVM path (default)
    const evm = useBorrow({
        onSuccess: options.onSuccess,
        onError: options.onError,
    });

    return {
        borrow: evm.borrow,
        isPending: evm.isPending,
        currentStep: evm.currentStep as ChainBorrowStep,
        error: evm.error,
        txHash: evm.hash ?? null,
        chainType: 'evm' as const,
    };
}

export { BorrowStep, SolanaBorrowStep };

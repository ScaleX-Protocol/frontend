'use client';

/* eslint-disable react-hooks/rules-of-hooks */

/**
 * Chain-Dispatch Deposit Hook
 *
 * Auto-switches between EVM (useDeposit) and Solana (useSolanaDeposit)
 * based on ChainTypeConfig. Components use this single hook — the chain
 * selection is transparent.
 *
 * Usage:
 *   const { deposit, isPending, currentStep, error, txHash } = useChainDeposit({ onSuccess });
 */

import { ChainTypeConfig } from '@/configs/chainType';
import { useDeposit, DepositStep } from './useDeposit';
import { useSolanaDeposit, SolanaDepositStep } from './svm/useSolanaDeposit';

/** Unified step enum for both chains */
export type ChainDepositStep = DepositStep | SolanaDepositStep;

interface UseChainDepositOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

/**
 * Unified deposit hook — delegates to EVM or Solana based on chain type.
 *
 * For EVM: uses the existing useDeposit hook (wagmi/viem)
 * For Solana: uses useSolanaDeposit (Anchor)
 */
export function useChainDeposit(options: UseChainDepositOptions = {}) {
    if (ChainTypeConfig.isSolana) {
        // Solana path
        const solana = useSolanaDeposit({
            onSuccess: options.onSuccess,
            onError: options.onError,
        });

        return {
            deposit: solana.deposit,
            isPending: solana.isPending,
            currentStep: solana.currentStep as ChainDepositStep,
            error: solana.error,
            txHash: solana.txHash,
            chainType: 'solana' as const,
        };
    }

    // EVM path (default)
    const evm = useDeposit({
        onSuccess: options.onSuccess,
        onError: options.onError,
    });

    return {
        deposit: evm.deposit,
        isPending: evm.isPending,
        currentStep: evm.currentStep as ChainDepositStep,
        error: evm.error,
        txHash: evm.hash ?? null,
        chainType: 'evm' as const,
    };
}

export { DepositStep, SolanaDepositStep };

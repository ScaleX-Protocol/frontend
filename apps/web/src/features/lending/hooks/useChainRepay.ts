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
import { useWalletState } from '@scalex/service-wallet';
import { useRepay, RepayStep } from './useRepay';
import { useSolanaRepay, SolanaRepayStep } from './svm/useSolanaRepay';

type SolanaWalletLike = { address: string; signTransaction: (tx: unknown) => Promise<unknown> };

/** Unified step enum for both chains */
export type ChainRepayStep = RepayStep | SolanaRepayStep;

/** Unified params accepted by the modal — both chains receive what they need */
export interface ChainRepayParams {
    tokenAddress: string; // used by EVM
    tokenSymbol: string;  // used by Solana
    amount: string;
    decimals?: number;
}

interface UseChainRepayOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

/**
 * Unified repay hook — delegates to EVM or Solana based on chain type.
 * Exposes a single `repay(ChainRepayParams)` so the calling modal never
 * needs to know which chain is active.
 *
 * For EVM: uses the existing useRepay hook (wagmi/viem)
 * For Solana: uses useSolanaRepay (Anchor)
 */
export function useChainRepay(options: UseChainRepayOptions = {}) {
    if (ChainTypeConfig.isSolana) {
        // Solana path — resolve embedded wallet internally so the modal stays chain-agnostic
        const { embeddedSolanaWallet } = useWalletState();
        const solana = useSolanaRepay({
            onSuccess: options.onSuccess,
            onError: options.onError,
        });

        return {
            repay: (params: ChainRepayParams) => {
                const wallet = embeddedSolanaWallet.wallet as SolanaWalletLike | undefined;
                if (!wallet) throw new Error('Embedded wallet not ready');
                return solana.repay({ tokenSymbol: params.tokenSymbol, amount: params.amount, decimals: params.decimals, wallet });
            },
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
        repay: (params: ChainRepayParams) =>
            evm.repay({ tokenAddress: params.tokenAddress, amount: params.amount, decimals: params.decimals ?? 18 }),
        isPending: evm.isPending,
        currentStep: evm.currentStep as ChainRepayStep,
        error: evm.error,
        txHash: evm.hash ?? null,
        chainType: 'evm' as const,
    };
}

export { RepayStep, SolanaRepayStep };

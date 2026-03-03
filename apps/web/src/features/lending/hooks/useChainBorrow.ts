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
import { useWalletState } from '@scalex/service-wallet';
import { useBorrow, BorrowStep } from './useBorrow';
import { useSolanaBorrow, SolanaBorrowStep } from './svm/useSolanaBorrow';

type SolanaWalletLike = { address: string; signTransaction: (tx: unknown) => Promise<unknown> };

/** Unified step enum for both chains */
export type ChainBorrowStep = BorrowStep | SolanaBorrowStep;

/** Unified params accepted by the modal — both chains receive what they need */
export interface ChainBorrowParams {
    tokenAddress: string; // used by EVM
    tokenSymbol: string;  // used by Solana
    amount: string;
    decimals?: number;
}

interface UseChainBorrowOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

/**
 * Unified borrow hook — delegates to EVM or Solana based on chain type.
 * Exposes a single `borrow(ChainBorrowParams)` so the calling modal never
 * needs to know which chain is active.
 *
 * For EVM: uses the existing useBorrow hook (wagmi/viem)
 * For Solana: uses useSolanaBorrow (Anchor)
 */
export function useChainBorrow(options: UseChainBorrowOptions = {}) {
    if (ChainTypeConfig.isSolana) {
        // Solana path — resolve embedded wallet internally so the modal stays chain-agnostic
        const { embeddedSolanaWallet } = useWalletState();
        const solana = useSolanaBorrow({
            onSuccess: options.onSuccess,
            onError: options.onError,
        });

        return {
            borrow: (params: ChainBorrowParams) => {
                const wallet = embeddedSolanaWallet.wallet as SolanaWalletLike | undefined;
                if (!wallet) throw new Error('Embedded wallet not ready');
                return solana.borrow({ tokenSymbol: params.tokenSymbol, amount: params.amount, decimals: params.decimals, wallet });
            },
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
        borrow: (params: ChainBorrowParams) =>
            evm.borrow({ tokenAddress: params.tokenAddress, amount: params.amount, decimals: params.decimals ?? 18 }),
        isPending: evm.isPending,
        currentStep: evm.currentStep as ChainBorrowStep,
        error: evm.error,
        txHash: evm.hash ?? null,
        chainType: 'evm' as const,
    };
}

export { BorrowStep, SolanaBorrowStep };

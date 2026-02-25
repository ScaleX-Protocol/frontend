'use client';

/* eslint-disable react-hooks/rules-of-hooks */

/**
 * Chain-Dispatch Place Order Hook
 *
 * Auto-switches between EVM (usePrivyPlaceOrder) and Solana (useSolanaPlaceOrder)
 * based on ChainTypeConfig. Components use this single hook.
 *
 * Usage:
 *   const { placeMarketOrder, placeLimitOrder, isPending } = useChainPlaceOrder({ onSuccess });
 */

import { ChainTypeConfig } from '@/configs/chainType';
import { usePrivyPlaceOrder } from './order/usePrivyPlaceOrder';
import { useSolanaPlaceOrder, SolanaOrderStep } from './svm/useSolanaPlaceOrder';

interface UseChainPlaceOrderOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

/**
 * Unified place order hook — delegates to EVM or Solana based on chain type.
 * ChainTypeConfig.isSolana is a build-time constant, so hooks are always
 * called in the same order within a given build.
 */
export function useChainPlaceOrder(options: UseChainPlaceOrderOptions = {}) {
    if (ChainTypeConfig.isSolana) {
        const solana = useSolanaPlaceOrder({
            onSuccess: options.onSuccess,
            onError: options.onError,
        });

        return {
            placeMarketOrder: solana.placeMarketOrder,
            placeLimitOrder: solana.placeLimitOrder,
            isPending: solana.isPending,
            isConfirming: solana.isConfirming,
            isAuthenticated: solana.isAuthenticated,
            currentStep: solana.currentStep,
            error: solana.error,
            txHash: solana.txHash,
            chainType: 'solana' as const,
        };
    }

    // EVM path (default)
    const evm = usePrivyPlaceOrder({
        onSuccess: options.onSuccess,
        onError: options.onError,
    });

    return {
        placeMarketOrder: evm.placeMarketOrder,
        placeLimitOrder: evm.placeLimitOrder,
        isPending: evm.isPending,
        isConfirming: evm.isConfirming,
        isAuthenticated: evm.isAuthenticated,
        currentStep: evm.currentStep,
        error: evm.error,
        txHash: evm.hash ?? null,
        chainType: 'evm' as const,
    };
}

export { SolanaOrderStep };

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
 *
 * Both placeMarketOrder and placeLimitOrder accept a unified param set.
 * EVM-specific fields (pool, depositAmount, etc.) are ignored on Solana.
 * Solana-specific fields (marketAddress, baseDecimals, quoteDecimals) are ignored on EVM.
 * The Solana wallet is injected automatically from useWalletState().
 */

import { ChainTypeConfig } from '@/configs/chainType';
import { usePrivyPlaceOrder, OrderSide, OrderStep, type Pool, TimeInForce } from './order/usePrivyPlaceOrder';
import { useSolanaPlaceOrder, SolanaOrderStep } from './svm/useSolanaPlaceOrder';
import { Side } from '@/lib/anchor';
import { useWalletState } from '@scalex/service-wallet';

export { OrderSide, OrderStep, TimeInForce, SolanaOrderStep };
export type { Pool };

interface UseChainPlaceOrderOptions {
    onSuccess?: (txHash: string, orderId?: string) => void;
    onError?: (error: Error) => void;
}

/** Unified params accepted by both placeMarketOrder and placeLimitOrder */
export interface UnifiedOrderParams {
    // ── Shared ──────────────────────────────────────────────────────────
    side: OrderSide;
    quantity: string;

    // ── EVM-specific (passed through unchanged) ──────────────────────
    pool?: Pool;
    price?: string;
    depositAmount?: string;
    quantityDecimals?: number;
    depositDecimals?: number;
    priceDecimals?: number;
    timeInForce?: TimeInForce;
    autoRepay?: boolean;
    autoBorrow?: boolean;

    // ── Solana-specific ───────────────────────────────────────────────
    /** On-chain market address (selectedMarket.poolId from /api/markets) */
    marketAddress?: string;
    baseDecimals?: number;
    quoteDecimals?: number;
    baseLotSize?: number;
    quoteLotSize?: number;
}

/**
 * Unified place order hook — delegates to EVM or Solana based on chain type.
 * ChainTypeConfig.isSolana is a build-time constant, so hooks are always
 * called in the same order within a given build.
 */
export function useChainPlaceOrder(options: UseChainPlaceOrderOptions = {}) {
    if (ChainTypeConfig.isSolana) {
        const wallet = useWalletState();
        const solana = useSolanaPlaceOrder({
            onSuccess: options.onSuccess ? (txHash) => options.onSuccess!(txHash) : undefined,
            onError: options.onError,
        });

        // Build Solana wallet from embeddedSolanaWallet (has signTransaction)
        const getSolanaWallet = () => ({
            address: wallet.embeddedSolanaWallet.address,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            signTransaction: (wallet.embeddedSolanaWallet.wallet as any)?.signTransaction,
        });

        const isAuthenticated =
            wallet.isConnected &&
            wallet.embeddedSolanaWallet.address !== 'Not Created';

        const placeMarketOrder = async (params: UnifiedOrderParams) => {
            return solana.placeMarketOrder({
                marketAddress: params.marketAddress!,
                side: params.side === OrderSide.BUY ? Side.Bid : Side.Ask,
                quantity: params.quantity,
                baseDecimals: params.baseDecimals ?? 8,
                quoteDecimals: params.quoteDecimals ?? 6,
                baseLotSize: params.baseLotSize,
                quoteLotSize: params.quoteLotSize,
                wallet: getSolanaWallet(),
            });
        };

        const placeLimitOrder = async (params: UnifiedOrderParams) => {
            return solana.placeLimitOrder({
                marketAddress: params.marketAddress!,
                side: params.side === OrderSide.BUY ? Side.Bid : Side.Ask,
                price: params.price ?? '0',
                quantity: params.quantity,
                baseDecimals: params.baseDecimals ?? 8,
                quoteDecimals: params.quoteDecimals ?? 6,
                baseLotSize: params.baseLotSize,
                quoteLotSize: params.quoteLotSize,
                wallet: getSolanaWallet(),
            });
        };

        return {
            placeMarketOrder,
            placeLimitOrder,
            isPending: solana.isPending,
            isConfirming: solana.isConfirming,
            isAuthenticated,
            currentStep: solana.currentStep,
            error: solana.error,
            txHash: solana.txHash,
            chainType: 'solana' as const,
        };
    }

    // EVM path (default) — pass through unchanged
    const evm = usePrivyPlaceOrder({
        onSuccess: options.onSuccess,
        onError: options.onError,
    });

    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        placeMarketOrder: evm.placeMarketOrder as (params: any) => Promise<void>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        placeLimitOrder: evm.placeLimitOrder as (params: any) => Promise<void>,
        isPending: evm.isPending,
        isConfirming: evm.isConfirming,
        isAuthenticated: evm.isAuthenticated,
        currentStep: evm.currentStep,
        error: evm.error,
        txHash: evm.hash ?? null,
        chainType: 'evm' as const,
    };
}

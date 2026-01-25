import { useCallback, useState } from 'react';

/**
 * Mobile stub for usePrivyPlaceOrder
 *
 * This is a stub implementation since Privy is not available in React Native.
 * When ready to enable trading, integrate with @privy-io/expo instead.
 */

// Define types and enums locally to avoid importing from the Privy-dependent file
export enum OrderSide {
  BUY = 0,
  SELL = 1
}

export enum TimeInForce {
  GTC = 0, // Good 'Til Canceled
  IOC = 1, // Immediate Or Cancel
  FOK = 2, // Fill Or Kill
  PO = 3   // Post Only
}

export enum OrderStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SIMULATING = 'simulating',
  SUBMITTING = 'submitting',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface Pool {
  base: string;
  quote: string;
  spacing: number;
  fee: number;
}

interface UsePrivyTradingOptions {
  onSuccess?: (hash: `0x${string}`, orderId?: number) => void;
  onError?: (error: Error) => void;
}

interface MarketOrderParams {
  pool: Pool;
  quantity: string;
  side: OrderSide;
  depositAmount: string;
  minOutAmount?: string;
  quantityDecimals?: number;
  depositDecimals?: number;
  autoRepay?: boolean;
  autoBorrow?: boolean;
}

interface LimitOrderParams {
  pool: Pool;
  price: string;
  quantity: string;
  side: OrderSide;
  timeInForce: TimeInForce;
  depositAmount: string;
  quantityDecimals?: number;
  depositDecimals?: number;
  priceDecimals?: number;
  autoRepay?: boolean;
  autoBorrow?: boolean;
}

export function usePrivyPlaceOrder({ onSuccess, onError }: UsePrivyTradingOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const placeMarketOrder = useCallback(async (params: MarketOrderParams) => {
    const err = new Error('Trading is not yet available in mobile app. Privy integration pending.');
    console.warn('[usePrivyPlaceOrder] placeMarketOrder called but Privy is disabled');
    setError(err);
    onError?.(err);
    throw err;
  }, [onError]);

  const placeLimitOrder = useCallback(async (params: LimitOrderParams) => {
    const err = new Error('Trading is not yet available in mobile app. Privy integration pending.');
    console.warn('[usePrivyPlaceOrder] placeLimitOrder called but Privy is disabled');
    setError(err);
    onError?.(err);
    throw err;
  }, [onError]);

  return {
    placeMarketOrder,
    placeLimitOrder,
    isPending,
    isConfirming: false,
    isConfirmed: false,
    error,
    hash: undefined,
    currentStep: 'idle' as OrderStep,
    receipt: undefined,
    isAuthenticated: false,
    address: undefined,
  };
}

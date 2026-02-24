import { useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/expo';
import { useSolanaProvider } from '~/src/lib/solana/provider';
import { PublicKey } from '@solana/web3.js';
import {
  buildPlaceLimitOrderIxs,
  buildPlaceMarketOrderIxs,
} from '~/src/lib/solana/place-order';
import { sendTransactionViaPrivy } from '~/src/lib/solana/send-transaction';

export enum OrderSide {
  BUY = 0,
  SELL = 1,
}

export enum TimeInForce {
  GTC = 0,
  IOC = 1,
  FOK = 2,
  PO = 3,
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
  onSuccess?: (hash: string, orderId?: number) => void;
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

export function usePrivyPlaceOrder({
  onSuccess,
  onError,
}: UsePrivyTradingOptions = {}) {
  const { isReady, user } = usePrivy();
  const { getProvider, getAddress } = useSolanaProvider();

  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState<OrderStep>(OrderStep.IDLE);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | undefined>();

  const address = getAddress();

  const placeMarketOrder = useCallback(
    async (params: MarketOrderParams) => {
      try {
        setError(null);
        setIsPending(true);
        setCurrentStep(OrderStep.VALIDATING);

        const provider = await getProvider();
        if (!provider) {
          throw new Error('No Solana wallet. Please log in.');
        }
        if (!address) {
          throw new Error('Wallet address not available');
        }

        setCurrentStep(OrderStep.SUBMITTING);
        const instructions = await buildPlaceMarketOrderIxs({
          pool: params.pool,
          quantity: params.quantity,
          side: params.side as 0 | 1,
          owner: new PublicKey(address),
          quantityDecimals: params.quantityDecimals,
        });

        const signature = await sendTransactionViaPrivy({
          instructions,
          feePayer: new PublicKey(address),
          provider,
        });

        setCurrentStep(OrderStep.COMPLETED);
        setHash(signature);
        setIsPending(false);
        onSuccess?.(signature);
        return signature;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setCurrentStep(OrderStep.ERROR);
        setIsPending(false);
        onError?.(e);
        throw e;
      }
    },
    [getProvider, address, onSuccess, onError]
  );

  const placeLimitOrder = useCallback(
    async (params: LimitOrderParams) => {
      try {
        setError(null);
        setIsPending(true);
        setCurrentStep(OrderStep.VALIDATING);

        const provider = await getProvider();
        if (!provider) {
          throw new Error('No Solana wallet. Please log in.');
        }
        if (!address) {
          throw new Error('Wallet address not available');
        }

        setCurrentStep(OrderStep.SUBMITTING);
        const instructions = await buildPlaceLimitOrderIxs({
          pool: params.pool,
          price: params.price,
          quantity: params.quantity,
          side: params.side as 0 | 1,
          timeInForce: params.timeInForce as 0 | 1 | 2 | 3,
          owner: new PublicKey(address),
          quantityDecimals: params.quantityDecimals,
          priceDecimals: params.priceDecimals,
        });

        const signature = await sendTransactionViaPrivy({
          instructions,
          feePayer: new PublicKey(address),
          provider,
        });

        setCurrentStep(OrderStep.COMPLETED);
        setHash(signature);
        setIsPending(false);
        onSuccess?.(signature);
        return signature;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setCurrentStep(OrderStep.ERROR);
        setIsPending(false);
        onError?.(e);
        throw e;
      }
    },
    [getProvider, address, onSuccess, onError]
  );

  return {
    placeMarketOrder,
    placeLimitOrder,
    isPending,
    isConfirming: currentStep === OrderStep.CONFIRMING,
    isConfirmed: currentStep === OrderStep.COMPLETED,
    error,
    hash,
    currentStep,
    receipt: undefined,
    isAuthenticated: Boolean(isReady && user && address),
    address: address ?? undefined,
  };
}

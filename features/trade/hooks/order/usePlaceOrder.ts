'use client';

import { useState, useCallback } from 'react';
import { formatUnits, getAddress, parseUnits } from 'viem';
import { useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Contracts, ScaleXRouterABI } from '@/configs/contracts';

// Contract addresses from centralized config
const ROUTER_ADDRESSES = {
  84532: Contracts[84532].scaleXRouterAddress
};

// Minimal logging utility - only essential logs
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[Trading] ${message}`);
  },
  success: (message: string, data?: any) => {
    console.log(`[Trading] ✓ ${message}`);
  },
  warning: (message: string, data?: any) => {
    console.warn(`[Trading] ⚠️ ${message}`);
  },
  error: (message: string, error?: any) => {
    console.error(`[Trading] ❌ ${message}`, error?.message || error);
  },
  debug: () => {
    // Disabled debug logging
  }
};

// Trading enums matching the contract
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

// Pool interface matching IPoolManager.Pool
export interface Pool {
  base: string;
  quote: string;
  spacing: number;
  fee: number;
}

interface UseTradingOptions {
  onSuccess?: (hash: `0x${string}`, orderId?: number) => void;
  onError?: (error: Error) => void;
}

interface MarketOrderParams {
  pool: Pool;
  quantity: string;
  side: OrderSide;
  depositAmount: string;
  minOutAmount?: string;
  decimals?: number;
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
  decimals?: number;
  autoRepay?: boolean;
  autoBorrow?: boolean;
}

export function usePlaceOrder({ onSuccess, onError }: UseTradingOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get current chain ID
  const chainId = useChainId();

  const getRouterAddress = useCallback((currentChainId: number) => {
    const routerAddress = ROUTER_ADDRESSES[currentChainId as keyof typeof ROUTER_ADDRESSES];

    if (!routerAddress) {
      const availableChains = Object.keys(ROUTER_ADDRESSES);
      const error = new Error(`ScaleXRouter contract not found on chain ${currentChainId}. Available chains: ${availableChains.join(', ')}`);
      logger.error('ScaleXRouter contract not found');
      throw error;
    }

    return routerAddress;
  }, []);

  const { writeContract, data: hash } = useWriteContract({
    mutation: {
      onSuccess: (transactionHash) => {
        logger.success('Transaction submitted successfully');
        setIsPending(false);
      },
      onError: (error) => {
        logger.error('Transaction failed', error.message);
        setIsPending(false);
        setError(error);
        onError?.(error);
      },
    },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
    chainId,
  });

  // Handle transaction confirmation
  const handleConfirmation = useCallback((callback?: (hash: `0x${string}`, orderId?: number) => void, orderId?: number) => {
    if (receipt && isConfirmed) {
      logger.success('Transaction confirmed');
      setError(null);
      callback?.(hash as `0x${string}`, orderId);
    }
  }, [receipt, isConfirmed, hash]);

  const placeMarketOrder = async ({
    pool,
    quantity,
    side,
    depositAmount,
    minOutAmount = '0',
    decimals = 18,
    autoRepay = false,
    autoBorrow = false
  }: MarketOrderParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);

      // Validate inputs
      if (!pool.base || !pool.quote) {
        throw new Error('Invalid pool: base and quote addresses are required');
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        throw new Error('Invalid quantity: must be greater than 0');
      }

      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        throw new Error('Invalid deposit amount: must be greater than 0');
      }

      // Prepare addresses and amounts
      const routerAddress = getRouterAddress(chainId);
      const quantityInWei = parseUnits(quantity, decimals);
      const depositAmountInWei = parseUnits(depositAmount, decimals);
      const minOutAmountInWei = parseUnits(minOutAmount, decimals);

      // Call placeMarketOrder function
      writeContract({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'placeMarketOrder',
        args: [
          {
            base: getAddress(pool.base),
            quote: getAddress(pool.quote),
            spacing: pool.spacing,
            fee: BigInt(pool.fee)
          },
          BigInt(quantityInWei.toString()),
          side,
          BigInt(depositAmountInWei.toString()),
          BigInt(minOutAmountInWei.toString()),
          autoRepay,
          autoBorrow
        ],
        chainId,
      });

      logger.success('Market order placed successfully');

      // Handle confirmation
      handleConfirmation(onSuccess);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      logger.error('Market order failed', error.message);
      setIsPending(false);
      setError(error);
      onError?.(error);
      throw error;
    }
  };

  const placeLimitOrder = async ({
    pool,
    price,
    quantity,
    side,
    timeInForce,
    depositAmount,
    decimals = 18,
    autoRepay = false,
    autoBorrow = false
  }: LimitOrderParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);

      // Validate inputs
      if (!pool.base || !pool.quote) {
        throw new Error('Invalid pool: base and quote addresses are required');
      }

      if (!price || parseFloat(price) <= 0) {
        throw new Error('Invalid price: must be greater than 0');
      }

      if (!quantity || parseFloat(quantity) <= 0) {
        throw new Error('Invalid quantity: must be greater than 0');
      }

      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        throw new Error('Invalid deposit amount: must be greater than 0');
      }

      // Prepare addresses and amounts
      const routerAddress = getRouterAddress(chainId);
      const priceInWei = parseUnits(price, decimals);
      const quantityInWei = parseUnits(quantity, decimals);
      const depositAmountInWei = parseUnits(depositAmount, decimals);

      // Call placeLimitOrder function
      writeContract({
        address: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'placeLimitOrder',
        args: [
          {
            base: getAddress(pool.base),
            quote: getAddress(pool.quote),
            spacing: pool.spacing,
            fee: BigInt(pool.fee)
          },
          BigInt(priceInWei.toString()),
          BigInt(quantityInWei.toString()),
          side,
          timeInForce,
          BigInt(depositAmountInWei.toString()),
          autoRepay,
          autoBorrow
        ],
        chainId,
      });

      logger.success('Limit order placed successfully');

      // Handle confirmation
      handleConfirmation(onSuccess);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      logger.error('Limit order failed', error.message);
      setIsPending(false);
      setError(error);
      onError?.(error);
      throw error;
    }
  };

  return {
    placeMarketOrder,
    placeLimitOrder,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Utility function to format token amount for display
export function formatTokenAmount(amount: bigint | undefined, decimals: number): string {
  if (!amount) return '0';
  return formatUnits(amount, decimals);
}

// Utility function to get side label
export function getSideLabel(side: OrderSide): string {
  return side === OrderSide.BUY ? 'Buy' : 'Sell';
}

// Utility function to getTimeInForceLabel
export function getTimeInForceLabel(timeInForce: TimeInForce): string {
  switch (timeInForce) {
    case TimeInForce.GTC:
      return 'Good \'Til Canceled';
    case TimeInForce.IOC:
      return 'Immediate Or Cancel';
    case TimeInForce.FOK:
      return 'Fill Or Kill';
    case TimeInForce.PO:
      return 'Post Only';
    default:
      return 'Unknown';
  }
}
'use client';

import { useReadContract } from 'wagmi';
import { Contracts, PoolManagerABI, OrderBookABI } from '@scalex/service-wallet';
import { ChainConfig } from '@scalex/service-wallet';

interface TradingRules {
  minTradeAmount: bigint;
  minAmountMovement: bigint;
  minPriceMovement: bigint;
  minOrderSize: bigint;
}

interface UseTradingRulesParams {
  baseTokenAddress: string;
  quoteTokenAddress: string;
}

export function useTradingRules({ baseTokenAddress, quoteTokenAddress }: UseTradingRulesParams) {
  const poolManagerAddress = Contracts[ChainConfig.defaultChainId].poolManagerAddress;

  // Step 1: Get the PoolKey from PoolManager
  const { data: poolKey } = useReadContract({
    address: poolManagerAddress,
    abi: PoolManagerABI,
    functionName: 'createPoolKey',
    args: [baseTokenAddress as `0x${string}`, quoteTokenAddress as `0x${string}`],
  });

  // Step 2: Get the Pool (which includes orderBook address)
  const { data: pool } = useReadContract({
    address: poolManagerAddress,
    abi: PoolManagerABI,
    functionName: 'getPool',
    args: poolKey ? [poolKey] : undefined,
    query: {
      enabled: !!poolKey,
    },
  });

  // Step 3: Get trading rules from the orderBook
  const orderBookAddress = pool ? (pool as any).orderBook : undefined;

  const {
    data: tradingRules,
    isLoading,
    error
  } = useReadContract({
    address: orderBookAddress as `0x${string}`,
    abi: OrderBookABI,
    functionName: 'getTradingRules',
    query: {
      enabled: !!orderBookAddress,
    },
  });

  return {
    tradingRules: tradingRules as TradingRules | undefined,
    orderBookAddress,
    poolKey,
    isLoading,
    error,
  };
}

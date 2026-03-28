'use client';

import { useReadContract } from 'wagmi';
import { Contracts, PoolManagerABI } from '@/configs/contracts';
import { ChainConfig } from '@/configs/chain';
import { getAddress } from 'viem';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PoolResolverParams {
  baseTokenAddress?: string;
  quoteTokenAddress?: string;
  enabled?: boolean;
}

interface PoolResolverResult {
  poolKey: any;
  orderBookAddress: `0x${string}` | undefined;
  poolData: any;
  isLoading: boolean;
  error: Error | null;
}

// ─── React Hook (for components & reactive hooks) ────────────────────────────

/**
 * Resolves pool key and orderbook address from base/quote token addresses.
 * Uses wagmi's `useReadContract` for automatic reactivity and caching.
 */
export function usePoolResolver({
  baseTokenAddress,
  quoteTokenAddress,
  enabled = true,
}: PoolResolverParams): PoolResolverResult {
  const poolManagerAddress = Contracts[ChainConfig.defaultChainId]?.poolManagerAddress;

  const isReady = enabled && !!poolManagerAddress && !!baseTokenAddress && !!quoteTokenAddress;

  // Step 1: Get the PoolKey — EVM only
  const {
    data: poolKey,
    isLoading: isLoadingPoolKey,
    error: poolKeyError,
  } = useReadContract({
    address: poolManagerAddress,
    abi: PoolManagerABI,
    functionName: 'createPoolKey',
    args: isReady
      ? [baseTokenAddress as `0x${string}`, quoteTokenAddress as `0x${string}`]
      : undefined,
    query: { enabled: isReady },
  });

  // Step 2: Get the Pool (includes orderBook address) — EVM only
  const {
    data: poolData,
    isLoading: isLoadingPool,
    error: poolError,
  } = useReadContract({
    address: poolManagerAddress,
    abi: PoolManagerABI,
    functionName: 'getPool',
    args: poolKey ? [poolKey] : undefined,
    query: { enabled: !!poolManagerAddress && !!poolKey },
  });

  const orderBookAddress = poolData
    ? ((poolData as any).orderBook as `0x${string}`)
    : undefined;

  return {
    poolKey,
    orderBookAddress,
    poolData,
    isLoading: isLoadingPoolKey || isLoadingPool,
    error: (poolKeyError || poolError) as Error | null,
  };
}

// ─── Imperative Function (for async transaction flows) ───────────────────────

/**
 * Imperatively resolves the orderbook address for a given token pair.
 * Use this inside async functions (e.g., placeMarketOrder, placeLimitOrder).
 */
export async function resolveOrderBook(
  walletClient: any,
  baseAddress: `0x${string}`,
  quoteAddress: `0x${string}`,
): Promise<`0x${string}`> {
  const poolManagerAddress = Contracts[ChainConfig.defaultChainId]?.poolManagerAddress;

  const checksumBase = getAddress(baseAddress);
  const checksumQuote = getAddress(quoteAddress);

  const poolKey = await walletClient.readContract({
    address: poolManagerAddress,
    abi: PoolManagerABI,
    functionName: 'createPoolKey',
    args: [checksumBase, checksumQuote],
  });

  const poolData = await walletClient.readContract({
    address: poolManagerAddress,
    abi: PoolManagerABI,
    functionName: 'getPool',
    args: [poolKey],
  }) as any;

  return poolData.orderBook as `0x${string}`;
}

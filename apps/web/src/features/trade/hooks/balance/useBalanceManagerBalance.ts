'use client';

import { useReadContract, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { BalanceManagerABI, Contracts } from '@/configs/contracts';
import { ChainConfig } from '@/configs/chain';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BalanceManagerBalanceParams {
  userAddress?: `0x${string}`;
  currencyAddress?: `0x${string}`;
  decimals?: number;
  enabled?: boolean;
}

interface BalanceManagerBalanceResult {
  balance: bigint | undefined;
  formattedBalance: string;
  isLoading: boolean;
  refetch: () => void;
}

// ─── React Hook (for components & reactive hooks) ────────────────────────────

/**
 * Reads the user's balance from the BalanceManager contract.
 * Uses wagmi's `useReadContract` for automatic reactivity and caching.
 */
export function useBalanceManagerBalance({
  userAddress,
  currencyAddress,
  decimals = 18,
  enabled = true,
}: BalanceManagerBalanceParams): BalanceManagerBalanceResult {
  const chainId = useChainId();
  const balanceManagerAddress = Contracts[chainId]?.balanceManagerAddress;

  const isReady = enabled && !!userAddress && !!currencyAddress && !!balanceManagerAddress;

  const { data: rawBalance, isLoading, refetch } = useReadContract({
    address: balanceManagerAddress,
    abi: BalanceManagerABI,
    functionName: 'getBalance',
    args: isReady ? [userAddress!, currencyAddress!] : undefined,
    query: {
      enabled: isReady,
      refetchInterval: 5000,
    },
  });

  const formattedBalance = rawBalance != null
    ? formatUnits(rawBalance as bigint, decimals)
    : '0';

  return {
    balance: rawBalance as bigint | undefined,
    formattedBalance,
    isLoading,
    refetch,
  };
}

// ─── Imperative Function (for async transaction flows) ───────────────────────

/**
 * Imperatively reads the user's balance from the BalanceManager.
 * Use this inside async functions (e.g., placeMarketOrder, placeLimitOrder).
 */
export async function getBalanceManagerBalance(
  walletClient: any,
  userAddress: `0x${string}`,
  currencyAddress: `0x${string}`,
): Promise<bigint> {
  const balanceManagerAddress = Contracts[ChainConfig.defaultChainId].balanceManagerAddress;

  const balance = await walletClient.readContract({
    address: balanceManagerAddress,
    abi: BalanceManagerABI,
    functionName: 'getBalance',
    args: [userAddress, currencyAddress],
  }) as bigint;

  return balance;
}

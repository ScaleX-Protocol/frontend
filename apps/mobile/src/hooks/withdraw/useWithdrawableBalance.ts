/**
 * Hook to get withdrawable (vault) balance for a token.
 * Implement with your protocol's API or on-chain account when available.
 */
import { useQuery } from '@tanstack/react-query';
import { useSolanaProvider } from '~/src/lib/solana/provider';

export type WithdrawTokenSymbol = 'USDT' | 'BTC' | 'WETH';

export interface UseWithdrawableBalanceOptions {
  tokenSymbol: WithdrawTokenSymbol | null;
  enabled?: boolean;
}

/**
 * Returns the user's withdrawable balance from the vault.
 * TODO: Integrate with protocol API or on-chain user account.
 * For now returns a placeholder - implement fetch from your indexer/API.
 */
export function useWithdrawableBalance({
  tokenSymbol,
  enabled = true,
}: UseWithdrawableBalanceOptions) {
  const { getAddress } = useSolanaProvider();
  const address = getAddress();

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['withdrawableBalance', tokenSymbol ?? '', address ?? ''],
    queryFn: async (): Promise<{ formatted: string; raw: bigint; decimals: number }> => {
      if (!tokenSymbol || !address) {
        return { formatted: '0', raw: 0n, decimals: 6 };
      }
      // TODO: Fetch from protocol API - e.g. GET /lending/balance/{address}?token={tokenSymbol}
      // For now return 0 - the withdraw tx will fail if user has no balance
      return {
        formatted: '0',
        raw: 0n,
        decimals: 6,
      };
    },
    enabled: enabled && !!tokenSymbol && !!address,
  });

  return {
    formattedBalance: data?.formatted ?? '0',
    rawBalance: data?.raw ?? 0n,
    decimals: data?.decimals ?? 6,
    isLoading,
    isFetching,
    refetch,
  };
}

/**
 * Hook to read SPL token balance by selected token symbol.
 */
import { useQuery } from '@tanstack/react-query';
import { useSolanaProvider } from '~/src/lib/solana/provider';
import { getTokenBalance } from '~/src/lib/solana/token-balance';
import { getTokenMintPk } from '~/src/lib/solana/pdas';

export type DepositTokenSymbol = 'USDT' | 'BTC' | 'WETH';

export interface UseTokenBalanceOptions {
  tokenSymbol: DepositTokenSymbol | null;
  enabled?: boolean;
}

export function useTokenBalance({
  tokenSymbol,
  enabled = true,
}: UseTokenBalanceOptions) {
  const { getAddress } = useSolanaProvider();
  const address = getAddress();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tokenBalance', tokenSymbol ?? '', address ?? ''],
    queryFn: async () => {
      if (!tokenSymbol || !address) return null;
      const mint = getTokenMintPk(tokenSymbol);
      const { PublicKey } = await import('@solana/web3.js');
      const owner = new PublicKey(address);
      return getTokenBalance(mint, owner, tokenSymbol);
    },
    enabled: enabled && !!tokenSymbol && !!address,
  });

  return {
    balance: data,
    rawBalance: data?.raw ?? 0n,
    formattedBalance: data?.formatted ?? '0',
    decimals: data?.decimals ?? 6,
    symbol: data?.symbol ?? tokenSymbol ?? '',
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

import { useQuery } from '@tanstack/react-query';
import { mockApi } from '../mockAPI/faucet.mockAPI';

export const useFaucetTokensData = (chainId: number) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['faucetTokens', chainId],
    queryFn: () => mockApi.getFaucetTokens(chainId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    faucetTokensData: data,
    loading: isLoading,
    error,
    refetch,
  };
};

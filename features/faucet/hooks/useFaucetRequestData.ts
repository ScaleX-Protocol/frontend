import { useQuery } from '@tanstack/react-query';
import { mockApi } from '../mockAPI/faucet.mockAPI';

export const useFaucetRequestData = (chainId: number, limit?: number) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['faucetRequests', chainId, limit],
    queryFn: () => mockApi.getFaucetRequests(chainId, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    faucetRequestsData: data,
    loading: isLoading,
    error,
    refetch,
  };
};

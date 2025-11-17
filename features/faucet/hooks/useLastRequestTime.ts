import { useQuery } from '@tanstack/react-query';
import type { HexAddress } from '../types/faucet.types';
import { mockApi } from '../mockAPI/faucet.mockAPI';

export const useLastRequestTime = (userAddress: HexAddress | undefined, faucetAddress: HexAddress) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['lastRequestTime', userAddress, faucetAddress],
    queryFn: () => mockApi.getLastRequestTime(userAddress!, faucetAddress),
    enabled: !!userAddress,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    lastRequestTime: data?.timestamp,
    loading: isLoading,
    error,
    refetch,
  };
};

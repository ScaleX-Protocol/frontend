import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { PredictionPositionsResponse } from '../types/prediction.types';

interface UseUserPositionsParams {
  userAddress: string | undefined;
  chainId?: number;
  onlyActive?: boolean;
}

export function useUserPositions(params: UseUserPositionsParams) {
  const { userAddress, chainId, onlyActive } = params;

  return useQuery<PredictionPositionsResponse, Error>({
    queryKey: ['predictionPositions', userAddress, chainId, onlyActive],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (chainId !== undefined) searchParams.set('chainId', String(chainId));
      if (onlyActive) searchParams.set('onlyActive', 'true');

      return fetchAPI<PredictionPositionsResponse>(
        `/predictions/positions/${userAddress}?${searchParams.toString()}`
      );
    },
    enabled: !!userAddress,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

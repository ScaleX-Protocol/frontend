import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { PredictionPositionsResponse } from '../types/prediction.types';

interface UseMarketPositionsParams {
  marketId: string | null;
  chainId?: number;
  userAddress?: string;
}

export function useMarketPositions(params: UseMarketPositionsParams) {
  const { marketId, chainId, userAddress } = params;

  return useQuery<PredictionPositionsResponse, Error>({
    queryKey: ['marketPositions', marketId, chainId, userAddress],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (chainId !== undefined) searchParams.set('chainId', String(chainId));
      if (userAddress) searchParams.set('userAddress', userAddress);

      return fetchAPI<PredictionPositionsResponse>(
        `/predictions/markets/${marketId}/positions?${searchParams.toString()}`
      );
    },
    enabled: !!marketId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

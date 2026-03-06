import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { PredictionStatsResponse } from '../types/prediction.types';

interface UsePredictionStatsParams {
  chainId?: number;
}

export function usePredictionStats(params: UsePredictionStatsParams = {}) {
  const { chainId } = params;

  return useQuery<PredictionStatsResponse, Error>({
    queryKey: ['predictionStats', chainId],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (chainId !== undefined) searchParams.set('chainId', String(chainId));
      const query = searchParams.toString();
      return fetchAPI<PredictionStatsResponse>(
        `/predictions/stats${query ? `?${query}` : ''}`
      );
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

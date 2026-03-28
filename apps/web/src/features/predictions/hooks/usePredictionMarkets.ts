import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { PredictionMarketsResponse } from '../types/prediction.types';
import { MarketStatus } from '../types/prediction.types';

interface UsePredictionMarketsParams {
  chainId?: number;
  status?: MarketStatus;
  limit?: number;
}

export function usePredictionMarkets(params: UsePredictionMarketsParams = {}) {
  const { chainId, status, limit = 50 } = params;

  return useQuery<PredictionMarketsResponse, Error>({
    queryKey: ['predictionMarkets', chainId, status, limit],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (chainId !== undefined) searchParams.set('chainId', String(chainId));
      if (status !== undefined) searchParams.set('status', String(status));
      searchParams.set('limit', String(limit));

      return fetchAPI<PredictionMarketsResponse>(
        `/predictions/markets?${searchParams.toString()}`
      );
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

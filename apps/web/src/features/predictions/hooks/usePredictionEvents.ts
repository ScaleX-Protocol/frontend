import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { PredictionEventsResponse } from '../types/prediction.types';

export function usePredictionEvents(marketId: string | undefined, options?: { limit?: number }) {
  const limit = options?.limit ?? 50;

  return useQuery<PredictionEventsResponse, Error>({
    queryKey: ['predictionEvents', marketId, limit],
    queryFn: () => fetchIndexerAPI<PredictionEventsResponse>(
      `/api/predictions/events/${marketId}?limit=${limit}`
    ),
    enabled: !!marketId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

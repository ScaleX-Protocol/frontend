import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { LendingStatsResponse } from '../types/lending.types';

interface UseLendingStatsParams {
  chainId?: number;
}

export function useLendingStats(params: UseLendingStatsParams = {}) {
  const { chainId } = params;

  return useQuery<LendingStatsResponse, Error>({
    queryKey: ['lendingStats', chainId],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (chainId !== undefined) searchParams.set('chainId', String(chainId));
      const query = searchParams.toString();
      return fetchAPI<LendingStatsResponse>(`/lending/stats${query ? `?${query}` : ''}`);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

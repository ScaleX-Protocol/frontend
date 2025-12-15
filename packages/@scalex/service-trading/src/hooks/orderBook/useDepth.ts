import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@scalex/api-client';
import type { DepthResponse } from '@scalex/types';

export interface UseDepthParams {
  symbol: string;
  limit?: number;
}

export function useDepth(
  params: UseDepthParams,
  options?: Omit<UseQueryOptions<DepthResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const { symbol, limit = 100 } = params;

  return useQuery<DepthResponse, Error>({
    queryKey: ['depth', symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchIndexerAPI<DepthResponse>(`/depth?${query}`);
    },
    enabled: !!symbol,
    refetchInterval: 1500,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
    ...options,
  });
}

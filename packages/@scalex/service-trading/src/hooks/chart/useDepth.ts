import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { DepthResponse } from '@scalex/types';
import { fetchIndexerAPI } from '@scalex/api-client';

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
    ...options,
  });
}

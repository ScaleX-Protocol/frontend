import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { DepthResponse } from '../../types/chart.types';

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

      return fetchAPI<DepthResponse>(`/depth?${query}`);
    },
    enabled: !!symbol,
    ...options,
  });
}

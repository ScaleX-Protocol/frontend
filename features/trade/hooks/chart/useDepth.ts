import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
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
    queryKey: ['depth', symbol, limit],
    queryFn: () => {
      const queryParams = new URLSearchParams({
        symbol,
        limit: limit.toString(),
      });
      return fetchAPI<DepthResponse>(`/depth?${queryParams}`);
    },
    enabled: !!symbol,
    ...options,
  });
}

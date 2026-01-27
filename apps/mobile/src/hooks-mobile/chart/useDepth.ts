import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchIndexerAPIMobile } from '../../lib/api/client';
import type { DepthResponse } from '@scalex/types';
import { formatSymbolForAPI } from '../../../lib/format';

export interface UseDepthParams {
  symbol: string;
  limit?: number;
}

/**
 * Mobile-optimized hook to fetch depth/order book chart data
 * - Includes offline support with short cache
 * - Note: For real-time order book, use useOrderBookDepth instead
 * - This is for chart visualization
 */
export function useDepth(
  params: UseDepthParams,
  options?: Omit<UseQueryOptions<DepthResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const { symbol, limit = 100 } = params;

  return useQuery<DepthResponse, Error>({
    queryKey: ['chartDepth', symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', formatSymbolForAPI(symbol));
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchIndexerAPIMobile<DepthResponse>(`/depth?${query}`, undefined, {
        ttl: 30000, // 30s cache
        staleWhileRevalidate: true,
        offlineFirst: false,
      });
    },
    enabled: !!symbol,
    staleTime: 10000,
    gcTime: 180000, // 3 minutes
    ...options,
  });
}

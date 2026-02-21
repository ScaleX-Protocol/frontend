import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchIndexerAPIMobile } from '../../../lib/api/client';
import type { DepthResponse } from '@scalex/types';
import { formatSymbolForAPI } from '../../../lib/format';

export interface UseOrderBookDepthParams {
  symbol: string;
  limit?: number;
}

/**
 * Mobile-optimized hook to fetch order book depth (real-time)
 * - Includes offline support with short cache (15s)
 * - Optimized refetch interval for mobile (2s instead of 1.5s)
 * - For high-frequency orderbook updates, consider WebSocket instead
 */
export function useOrderBookDepth(
  params: UseOrderBookDepthParams,
  options?: Omit<UseQueryOptions<DepthResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const { symbol, limit = 100 } = params;

  return useQuery<DepthResponse, Error>({
    queryKey: ['orderBookDepth', symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', formatSymbolForAPI(symbol));
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchIndexerAPIMobile<DepthResponse>(`/depth?${query}`, undefined, {
        ttl: 15000, // 15s cache (short for real-time data)
        staleWhileRevalidate: true,
        offlineFirst: false,
      });
    },
    enabled: !!symbol,
    refetchInterval: 2000, // 2s for mobile (vs 1.5s on web) - battery optimization
    refetchIntervalInBackground: false, // Save battery
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 60000, // 1 minute
    structuralSharing: false,
    ...options,
  });
}

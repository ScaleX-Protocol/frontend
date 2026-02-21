import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchIndexerAPIMobile } from '../../../lib/api/client';
import type { Trade } from '@scalex/types';
import { formatSymbolForAPI } from '../../../lib/format';

export interface UseOrderBookTradesParams {
  symbol: string;
  limit?: number;
  user?: string;
  orderBy?: 'asc' | 'desc';
}

/**
 * Mobile-optimized hook to fetch order book trades (recent trades)
 * - Includes offline support with short cache (20s)
 * - Optimized refetch interval for mobile (3s instead of 2s)
 * - For high-frequency updates, consider WebSocket instead
 */
export function useOrderBookTrades(
  params: UseOrderBookTradesParams,
  options?: Omit<UseQueryOptions<Trade[], Error>, 'queryKey' | 'queryFn'>,
) {
  const { symbol, limit = 500, user, orderBy = 'desc' } = params;

  return useQuery<Trade[], Error>({
    queryKey: ['orderBookTrades', symbol, limit, user, orderBy] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', formatSymbolForAPI(symbol));
      if (limit) searchParams.set('limit', String(limit));
      if (user) searchParams.set('user', user);
      if (orderBy) searchParams.set('orderBy', orderBy);

      const query = searchParams.toString();

      return fetchIndexerAPIMobile<Trade[]>(`/trades?${query}`, undefined, {
        ttl: 20000, // 20s cache
        staleWhileRevalidate: true,
        offlineFirst: false,
      });
    },
    enabled: !!symbol,
    refetchInterval: 3000, // 3s for mobile (vs 2s on web) - battery optimization
    refetchIntervalInBackground: false, // Save battery
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 60000, // 1 minute
    structuralSharing: false,
    ...options,
  });
}

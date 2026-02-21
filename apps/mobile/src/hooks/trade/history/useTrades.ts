import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Trade } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../../../lib/api/client';
import { formatSymbolForAPI } from '../../../lib/format';

export interface UseTradesParams {
  symbol: string;
  limit?: number;
  user?: string;
  orderBy?: 'asc' | 'desc';
}

/**
 * Mobile-optimized hook to fetch trade history
 * - Includes offline support with 30s cache
 * - Optimized refetch for mobile (5s instead of 3s)
 */
export function useTrades(
  params: UseTradesParams,
  options?: Omit<UseQueryOptions<Trade[], Error>, 'queryKey' | 'queryFn'>,
) {
  const { symbol, limit = 500, user, orderBy = 'desc' } = params;

  return useQuery<Trade[], Error>({
    queryKey: ['historyTrades', symbol, limit, user, orderBy] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', formatSymbolForAPI(symbol));
      if (limit) searchParams.set('limit', String(limit));
      if (user) searchParams.set('user', user);
      if (orderBy) searchParams.set('orderBy', orderBy);

      const query = searchParams.toString();

      return fetchIndexerAPIMobile<Trade[]>(`/trades?${query}`, undefined, {
        ttl: 30000, // 30s cache
        staleWhileRevalidate: true,
        offlineFirst: false,
      });
    },
    enabled: !!symbol,
    refetchInterval: 5000, // 5s for mobile (vs 3s on web)
    refetchIntervalInBackground: false, // Save battery
    refetchOnWindowFocus: true,
    staleTime: 2000,
    gcTime: 180000, // 3 minutes
    structuralSharing: false,
    ...options,
  });
}

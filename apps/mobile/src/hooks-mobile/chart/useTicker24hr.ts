import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Ticker24hr } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../../lib/api/client';
import { formatSymbolForAPI } from '../../../lib/format';

/**
 * Mobile-optimized hook to fetch 24hr ticker data
 * - Includes offline support with 30s cache
 * - Stale-while-revalidate for instant UI updates
 */
export function useTicker24hr(
  symbol: string,
  options?: Omit<UseQueryOptions<Ticker24hr, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<Ticker24hr, Error>({
    queryKey: ['ticker24hr', symbol] as const,
    queryFn: () => {
      const formattedSymbol = formatSymbolForAPI(symbol);
      const encodedSymbol = encodeURIComponent(formattedSymbol);
      const url = `/ticker/24hr?symbol=${encodedSymbol}`;
      return fetchIndexerAPIMobile<Ticker24hr>(url, undefined, {
        ttl: 30000, // 30s cache
        staleWhileRevalidate: true,
        offlineFirst: false,
      });
    },
    enabled: !!symbol,
    staleTime: 10000, // Consider stale after 10s
    gcTime: 180000, // Keep in cache for 3 minutes
    ...options,
  });
}

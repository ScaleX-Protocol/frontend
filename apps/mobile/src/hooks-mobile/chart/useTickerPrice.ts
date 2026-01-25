import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { TickerPrice } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../../lib/api/client';

/**
 * Mobile-optimized hook to fetch ticker price
 * - Includes offline support with 30s cache
 * - Optimized for real-time price updates
 */
export function useTickerPrice(
  symbol: string,
  options?: Omit<UseQueryOptions<TickerPrice, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TickerPrice, Error>({
    queryKey: ['tickerPrice', symbol] as const,
    queryFn: () => fetchIndexerAPIMobile<TickerPrice>(`/ticker/price?symbol=${encodeURIComponent(symbol)}`, undefined, {
      ttl: 30000,
      staleWhileRevalidate: true,
      offlineFirst: false,
    }),
    enabled: !!symbol,
    staleTime: 5000,
    gcTime: 120000, // 2 minutes
    ...options,
  });
}

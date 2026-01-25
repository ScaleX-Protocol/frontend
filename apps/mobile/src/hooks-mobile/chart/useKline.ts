import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { KlineData } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../../lib/api/client';
import { formatSymbolForAPI } from '../../../lib/format';

export interface UseKlineParams {
  symbol: string;
  interval?: '1m' | '5m' | '30m' | '1h' | '1d';
  startTime?: number;
  endTime?: number;
  limit?: number;
}

/**
 * Mobile-optimized hook to fetch kline/candlestick data
 * - Includes offline support with 2min cache
 * - Longer cache for historical data
 * - Optimized for chart rendering
 */
export function useKline(
  params: UseKlineParams,
  options?: Omit<UseQueryOptions<KlineData[], Error>, 'queryKey' | 'queryFn'>,
) {
  const { symbol, interval = '1m', startTime, endTime, limit } = params;

  return useQuery<KlineData[], Error>({
    queryKey: ['kline', symbol, interval, startTime, endTime, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', formatSymbolForAPI(symbol));
      if (interval) searchParams.set('interval', String(interval));
      if (startTime) searchParams.set('startTime', String(startTime));
      if (endTime) searchParams.set('endTime', String(endTime));
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchIndexerAPIMobile<KlineData[]>(`/kline?${query}`, undefined, {
        ttl: 120000, // 2min cache for kline data
        staleWhileRevalidate: true,
        offlineFirst: false,
      });
    },
    enabled: !!symbol,
    staleTime: 60000, // 1 minute
    gcTime: 600000, // Keep in cache for 10 minutes
    ...options,
  });
}

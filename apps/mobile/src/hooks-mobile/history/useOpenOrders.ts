import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Order } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../../lib/api/client';
import { formatSymbolForAPI } from '../../../lib/format';

export interface UseOpenOrdersParams {
  address: string;
  symbol?: string;
  limit?: number;
}

/**
 * Mobile-optimized hook to fetch open orders
 * - Includes offline support with 20s cache
 * - Active orders need fresher data than historical
 */
export function useOpenOrders(
  params: UseOpenOrdersParams,
  options?: Omit<UseQueryOptions<Order[], Error>, 'queryKey' | 'queryFn'>,
) {
  const { address, symbol, limit = 10 } = params;

  return useQuery<Order[], Error>({
    queryKey: ['openOrders', address, symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (address) searchParams.set('address', address);
      if (symbol) searchParams.set('symbol', formatSymbolForAPI(symbol));
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchIndexerAPIMobile<Order[]>(`/openOrders?${query}`, undefined, {
        ttl: 20000, // 20s cache
        staleWhileRevalidate: true,
        offlineFirst: false,
      });
    },
    enabled: !!address,
    staleTime: 5000,
    gcTime: 180000, // 3 minutes
    ...options,
  });
}

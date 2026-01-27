import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Order } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../../lib/api/client';

export interface UseAllOrdersParams {
  address: string;
  symbol?: string;
  limit?: number;
}

/**
 * Mobile-optimized hook to fetch all orders (history)
 * - Includes offline support with 1min cache
 * - Historical data can be cached more aggressively
 */
export function useAllOrders(
  params: UseAllOrdersParams,
  options?: Omit<UseQueryOptions<Order[], Error>, 'queryKey' | 'queryFn'>,
) {
  const { address, symbol, limit = 500 } = params;

  return useQuery<Order[], Error>({
    queryKey: ['allOrders', address, symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (address) searchParams.set('address', address);
      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchIndexerAPIMobile<Order[]>(`/allOrders?${query}`, undefined, {
        ttl: 60000, // 1min cache for historical data
        staleWhileRevalidate: true,
        offlineFirst: false,
      });
    },
    enabled: !!address,
    staleTime: 30000,
    gcTime: 300000, // 5 minutes
    ...options,
  });
}

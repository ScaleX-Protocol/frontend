import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Order } from '@scalex/types';
import { fetchIndexerAPI } from '@scalex/api-client';

export interface UseAllOrdersParams {
  address: string;
  symbol?: string;
  limit?: number;
}

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

      return fetchIndexerAPI<Order[]>(`/allOrders?${query}`);
    },
    enabled: !!address,
    ...options,
  });
}

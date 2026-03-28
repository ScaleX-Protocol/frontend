import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { Order } from '../../types/history.types';

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

      return fetchAPI<Order[]>(`/allOrders?${query}`);
    },
    enabled: !!address && address !== 'Not Created',
    ...options,
  });
}

import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
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
    queryKey: ['allOrders', address, symbol, limit],
    queryFn: () => {
      const queryParams = new URLSearchParams({
        address,
        limit: limit.toString(),
        ...(symbol && { symbol }),
      });
      return fetchAPI<Order[]>(`/allOrders?${queryParams}`);
    },
    enabled: !!address,
    ...options,
  });
}

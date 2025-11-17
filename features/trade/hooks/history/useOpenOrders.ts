import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { Order } from '../../types/history.types';

export interface UseOpenOrdersParams {
  address: string;
  symbol?: string;
}

export function useOpenOrders(
  params: UseOpenOrdersParams,
  options?: Omit<UseQueryOptions<Order[], Error>, 'queryKey' | 'queryFn'>,
) {
  const { address, symbol } = params;

  return useQuery<Order[], Error>({
    queryKey: ['openOrders', address, symbol],
    queryFn: () => {
      const queryParams = new URLSearchParams({
        address,
        ...(symbol && { symbol }),
      });
      return fetchAPI<Order[]>(`/openOrders?${queryParams}`);
    },
    enabled: !!address,
    ...options,
  });
}

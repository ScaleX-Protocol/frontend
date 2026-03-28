import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { Order } from '../../types/history.types';

export interface UseOpenOrdersParams {
  address: string;
  symbol?: string;
  limit?: number;
}

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
      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchAPI<Order[]>(`/openOrders?${query}`);
    },
    enabled: !!address && address !== 'Not Created',
    ...options,
  });
}

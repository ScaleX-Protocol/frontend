import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Order } from '../../types/history.types';
import { fetchIndexer } from '@/hooks/fetchIndexer';

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
    queryKey: ['openOrders', address, symbol] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();
      
      if (address) searchParams.set('address', address);
      if (symbol) searchParams.set('symbol', symbol);
      
      const query = searchParams.toString();

      return fetchIndexer<Order[]>(`/openOrders?${query}`);
    },
    enabled: !!address,
    ...options,
  });
}

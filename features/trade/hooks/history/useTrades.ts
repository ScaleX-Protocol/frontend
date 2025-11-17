import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { Trade } from '../../types/history.types';

export interface UseTradesParams {
  symbol: string;
  limit?: number;
  user?: string;
  orderBy?: 'asc' | 'desc';
}

export function useTrades(
  params: UseTradesParams,
  options?: Omit<UseQueryOptions<Trade[], Error>, 'queryKey' | 'queryFn'>,
) {
  const { symbol, limit = 500, user, orderBy = 'desc' } = params;

  return useQuery<Trade[], Error>({
    queryKey: ['trades', symbol, limit, user, orderBy],
    queryFn: () => {
      const queryParams = new URLSearchParams({
        symbol,
        limit: limit.toString(),
        orderBy,
        ...(user && { user }),
      });
      return fetchAPI<Trade[]>(`/trades?${queryParams}`);
    },
    enabled: !!symbol,
    ...options,
  });
}

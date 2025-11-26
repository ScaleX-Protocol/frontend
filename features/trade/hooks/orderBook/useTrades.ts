import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchIndexer } from '@/hooks/fetchIndexer';
import type { Trade } from '../../types/orderBook.types';

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
    queryKey: ['trades', symbol, limit, user, orderBy] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));
      if (user) searchParams.set('user', user);
      if (orderBy) searchParams.set('orderBy', orderBy);

      const query = searchParams.toString();

      return fetchIndexer<Trade[]>(`/trades?${query}`);
    },
    enabled: !!symbol,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
    ...options,
  });
}

import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Trade } from '@scalex/types';
import { fetchIndexerAPI } from '@scalex/api-client';

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

      return fetchIndexerAPI<Trade[]>(`/trades?${query}`);
    },
    enabled: !!symbol,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
    ...options,
  });
}

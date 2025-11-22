import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Ticker24hr } from '../../types/chart.types';
import { fetchIndexer } from '@/hooks/fetchIndexer';

export function useTicker24hr(
  symbol: string,
  options?: Omit<UseQueryOptions<Ticker24hr, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<Ticker24hr, Error>({
    queryKey: ['ticker24hr', symbol] as const,
    queryFn: () => fetchIndexer<Ticker24hr>(`/ticker/24hr?symbol=${symbol}`),
    enabled: !!symbol,
    ...options,
  });
}

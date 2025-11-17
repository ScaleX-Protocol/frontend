import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { Ticker24hr } from '../../types/chart.types';

export function useTicker24hr(
  symbol: string,
  options?: Omit<UseQueryOptions<Ticker24hr, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<Ticker24hr, Error>({
    queryKey: ['ticker24hr', symbol],
    queryFn: () => fetchAPI<Ticker24hr>(`/ticker/24hr?symbol=${symbol}`),
    enabled: !!symbol,
    ...options,
  });
}

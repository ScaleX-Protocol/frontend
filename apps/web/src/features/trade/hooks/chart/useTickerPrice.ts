import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { TickerPrice } from '../../types/chart.types';

export function useTickerPrice(
  symbol: string,
  options?: Omit<UseQueryOptions<TickerPrice, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TickerPrice, Error>({
    queryKey: ['tickerPrice', symbol] as const,
    queryFn: () => fetchAPI<TickerPrice>(`/ticker/price?symbol=${symbol}`),
    enabled: !!symbol,
    ...options,
  });
}

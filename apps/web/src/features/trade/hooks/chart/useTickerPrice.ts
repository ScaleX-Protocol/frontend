import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { TickerPrice } from '../../types/chart.types';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';

export function useTickerPrice(
  symbol: string,
  options?: Omit<UseQueryOptions<TickerPrice, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TickerPrice, Error>({
    queryKey: ['tickerPrice', symbol] as const,
    queryFn: () => fetchIndexerAPI<TickerPrice>(`/ticker/price?symbol=${symbol}`),
    enabled: !!symbol,
    ...options,
  });
}

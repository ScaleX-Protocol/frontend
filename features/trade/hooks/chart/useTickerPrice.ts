import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { TickerPrice } from '../../types/chart.types';

export function useTickerPrice(
  symbol: string,
  options?: Omit<UseQueryOptions<TickerPrice, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TickerPrice, Error>({
    queryKey: ['tickerPrice', symbol],
    queryFn: () => fetchAPI<TickerPrice>(`/ticker/price?symbol=${symbol}`),
    enabled: !!symbol,
    ...options,
  });
}

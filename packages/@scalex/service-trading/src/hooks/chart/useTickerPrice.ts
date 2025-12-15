import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { TickerPrice } from '@scalex/types';
import { fetchIndexerAPI } from '@scalex/api-client';

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

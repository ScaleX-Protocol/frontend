import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { KlineData } from '../../types/chart.types';
import { fetchIndexer } from '@/hooks/fetchIndexer';

export interface UseKlineParams {
  symbol: string;
  interval?: '1m' | '5m' | '30m' | '1h' | '1d';
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export function useKline(
  params: UseKlineParams,
  options?: Omit<UseQueryOptions<KlineData[], Error>, 'queryKey' | 'queryFn'>,
) {
  const { symbol, interval = '1m', startTime, endTime, limit } = params;

  return useQuery<KlineData[], Error>({
    queryKey: ['kline', symbol, interval, startTime, endTime, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', symbol);
      if (interval) searchParams.set('interval', String(interval));
      if (startTime) searchParams.set('startTime', String(startTime));
      if (endTime) searchParams.set('endTime', String(endTime));
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchIndexer<KlineData[]>(`/kline?${query}`);
    },
    enabled: !!symbol,
    ...options,
  });
}

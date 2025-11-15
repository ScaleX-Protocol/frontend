import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { KlineData } from '../../types/chart.types';

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
    queryKey: ['kline', symbol, interval, startTime, endTime, limit],
    queryFn: () => {
      const queryParams = new URLSearchParams({
        symbol,
        interval,
        ...(startTime && { startTime: startTime.toString() }),
        ...(endTime && { endTime: endTime.toString() }),
        ...(limit && { limit: limit.toString() }),
      });
      return fetchAPI<KlineData[]>(`/kline?${queryParams}`);
    },
    enabled: !!symbol,
    ...options,
  });
}

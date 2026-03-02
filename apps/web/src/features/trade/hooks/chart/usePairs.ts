import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { TradingPair } from '../../types/chart.types';

export function usePairs(options?: Omit<UseQueryOptions<TradingPair[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<TradingPair[], Error>({
    queryKey: ['pairs'] as const,
    queryFn: () => fetchAPI<TradingPair[]>('/pairs'),
    ...options,
  });
}

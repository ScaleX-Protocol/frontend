import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { TradingPair } from '../../types/chart.types';
import { fetchIndexer } from '@/hooks/fetchIndexer';

export function usePairs(options?: Omit<UseQueryOptions<TradingPair[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<TradingPair[], Error>({
    queryKey: ['pairs'] as const,
    queryFn: () => fetchIndexer<TradingPair[]>('/pairs'),
    ...options,
  });
}

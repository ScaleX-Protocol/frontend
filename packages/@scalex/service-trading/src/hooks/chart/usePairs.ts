import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { TradingPair } from '@scalex/types';
import { fetchIndexerAPI } from '@scalex/api-client';

export function usePairs(options?: Omit<UseQueryOptions<TradingPair[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<TradingPair[], Error>({
    queryKey: ['pairs'] as const,
    queryFn: () => fetchIndexerAPI<TradingPair[]>('/pairs'),
    ...options,
  });
}

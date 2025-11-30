import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Market } from '../../types/chart.types';
import { fetchIndexer } from '@/hooks/fetchIndexer';

export function useMarkets(options?: Omit<UseQueryOptions<Market[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<Market[], Error>({
    queryKey: ['markets'] as const,
    queryFn: () => fetchIndexer<Market[]>('/markets'),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    ...options,
  });
}

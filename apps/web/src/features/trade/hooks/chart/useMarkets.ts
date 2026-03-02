import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { Market } from '../../types/chart.types';

export function useMarkets(options?: Omit<UseQueryOptions<Market[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<Market[], Error>({
    queryKey: ['markets'] as const,
    queryFn: () => fetchAPI<Market[]>('/markets'),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    ...options,
  });
}

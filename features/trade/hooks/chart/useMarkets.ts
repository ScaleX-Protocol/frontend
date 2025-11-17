import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { Market } from '../../types/chart.types';

export function useMarkets(options?: Omit<UseQueryOptions<Market[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<Market[], Error>({
    queryKey: ['markets'],
    queryFn: () => fetchAPI<Market[]>('/markets'),
    ...options,
  });
}

import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { TradingPair } from '../../types/chart.types';

export function usePairs(options?: Omit<UseQueryOptions<TradingPair[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<TradingPair[], Error>({
    queryKey: ['pairs'],
    queryFn: () => fetchAPI<TradingPair[]>('/pairs'),
    ...options,
  });
}

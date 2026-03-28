import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { ActivityResponse, ActivityFilter, TimePeriodFilter } from '../types/activity.types';

export interface UsePortfolioActivityParams {
  address: string;
  type?: ActivityFilter;
  period?: TimePeriodFilter;
  limit?: number;
  offset?: number;
  chainId?: number;
}

export function usePortfolioActivity(
  params: UsePortfolioActivityParams,
  options?: Omit<UseQueryOptions<ActivityResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const { address, type = 'all', period = 'all', limit = 20, offset = 0, chainId } = params;

  return useQuery<ActivityResponse, Error>({
    queryKey: ['portfolioActivity', address, type, period, limit, offset] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (type !== 'all') searchParams.set('type', type);
      if (period !== 'all') searchParams.set('period', period);
      searchParams.set('limit', String(limit));
      searchParams.set('offset', String(offset));
      if (chainId) searchParams.set('chainId', String(chainId));

      const query = searchParams.toString();
      return fetchAPI<ActivityResponse>(`/activity/${address}${query ? `?${query}` : ''}`);
    },
    enabled: !!address,
    ...options,
  });
}

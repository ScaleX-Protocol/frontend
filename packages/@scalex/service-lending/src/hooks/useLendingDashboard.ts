import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@scalex/api-client';
import type { LendingDashboard } from '@scalex/types';

export interface UseLendingDashboardParams {
  user: string;
  chainId?: number;
}

export function useLendingDashboard(
  params: UseLendingDashboardParams,
  options?: Omit<UseQueryOptions<LendingDashboard, Error>, 'queryKey' | 'queryFn'>,
) {
  const { user, chainId } = params;

  return useQuery<LendingDashboard, Error>({
    queryKey: ['lendingDashboard', user, chainId] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (chainId) searchParams.set('chainId', String(chainId));

      const query = searchParams.toString();
      return fetchIndexerAPI<LendingDashboard>(`/lending/dashboard/${user}${query ? `?${query}` : ''}`);
    },
    enabled: !!user,
    staleTime: 30000,
    ...options,
  });
}

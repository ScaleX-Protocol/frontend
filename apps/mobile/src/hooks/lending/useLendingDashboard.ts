import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { LendingDashboard } from '@scalex/types';
import { fetchIndexerAPI } from '@scalex/api-client';

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
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (chainId) searchParams.set('chainId', String(chainId));

      const query = searchParams.toString();
      const url = `/lending/dashboard/${user}${query ? `?${query}` : ''}`;

      return fetchIndexerAPI<LendingDashboard>(url);
    },
    enabled: !!user && (options?.enabled !== false),
    staleTime: 30000,
    ...options,
  });
}

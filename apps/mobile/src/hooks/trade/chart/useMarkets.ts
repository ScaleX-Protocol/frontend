import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Market } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../../../lib/api/client';

/**
 * Mobile-optimized hook to fetch all markets
 * - Includes offline support with 60s cache
 * - Optimized refetch intervals for mobile (10s instead of 5s)
 * - Stale-while-revalidate for better UX
 */
export function useMarkets(options?: Omit<UseQueryOptions<Market[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<Market[], Error>({
    queryKey: ['markets'] as const,
    queryFn: () => fetchIndexerAPIMobile<Market[]>('/markets', undefined, {
      ttl: 60000, // 60s cache
      staleWhileRevalidate: true,
      offlineFirst: false,
    }),
    refetchInterval: 10000, // 10s for mobile (vs 5s on web)
    refetchIntervalInBackground: false, // Save battery
    refetchOnWindowFocus: true,
    staleTime: 5000, // Consider data stale after 5s
    gcTime: 300000, // Keep in cache for 5 minutes
    ...options,
  });
}

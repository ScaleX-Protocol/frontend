import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { TradingPair } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../../lib/api/client';

/**
 * Mobile-optimized hook to fetch trading pairs
 * - Includes offline support with 2min cache
 * - Pairs data changes infrequently
 */
export function usePairs(options?: Omit<UseQueryOptions<TradingPair[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<TradingPair[], Error>({
    queryKey: ['pairs'] as const,
    queryFn: () => fetchIndexerAPIMobile<TradingPair[]>('/pairs', undefined, {
      ttl: 120000, // 2min cache
      staleWhileRevalidate: true,
      offlineFirst: true, // Pairs change infrequently, use cache first
    }),
    staleTime: 60000,
    gcTime: 600000, // 10 minutes
    ...options,
  });
}

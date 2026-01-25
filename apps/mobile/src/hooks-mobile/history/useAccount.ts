import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AccountInfo } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../../lib/api/client';

/**
 * Mobile-optimized hook to fetch account information
 * - Includes offline support with 30s cache
 * - User balance data changes frequently
 */
export function useAccount(
  address: string,
  options?: Omit<UseQueryOptions<AccountInfo, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AccountInfo, Error>({
    queryKey: ['account', address] as const,
    queryFn: () => fetchIndexerAPIMobile<AccountInfo>(`/account?address=${address}`, undefined, {
      ttl: 30000, // 30s cache
      staleWhileRevalidate: true,
      offlineFirst: false,
    }),
    enabled: !!address,
    staleTime: 10000,
    gcTime: 180000, // 3 minutes
    ...options,
  });
}

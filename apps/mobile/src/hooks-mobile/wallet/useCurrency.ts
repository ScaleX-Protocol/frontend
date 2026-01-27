import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPIMobile } from '../../lib/api/client';
import type { SingleCurrencyResponse } from '@scalex/types';

/**
 * Mobile-optimized hook to fetch a single currency
 * - Includes offline support with 2min cache
 * - Currency metadata is static, use aggressive caching
 */
export const useCurrency = (
  address: string,
  options?: UseQueryOptions<SingleCurrencyResponse, Error>
) => {
  return useQuery({
    queryKey: ['currency', address],
    queryFn: () => fetchAPIMobile<SingleCurrencyResponse>(`/currencies/${address}`, undefined, {
      ttl: 120000, // 2min cache
      staleWhileRevalidate: true,
      offlineFirst: true, // Currency metadata is static
    }),
    enabled: !!address,
    staleTime: 60000,
    gcTime: 600000, // 10 minutes
    ...options,
  });
};

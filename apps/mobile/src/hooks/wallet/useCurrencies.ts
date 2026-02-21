import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPIMobile } from '../../lib/api/client';
import type { CurrenciesResponse } from '@scalex/types';

export interface UseCurrenciesParams {
  chainId?: number;
  limit?: number;
  offset?: number;
  tokenType?: 'underlying' | 'synthetic';
  onlyActual?: boolean;
}

/**
 * Mobile-optimized hook to fetch currencies
 * - Includes offline support with 2min cache
 * - Currencies change infrequently, good candidate for aggressive caching
 */
export const useCurrencies = (
  params?: UseCurrenciesParams,
  options?: UseQueryOptions<CurrenciesResponse, Error>
) => {
  const queryParams = new URLSearchParams();

  if (params?.chainId) queryParams.append('chainId', params.chainId.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.tokenType) queryParams.append('tokenType', params.tokenType);
  if (params?.onlyActual) queryParams.append('onlyActual', 'true');

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/currencies?${queryString}` : '/currencies';

  return useQuery({
    queryKey: ['currencies', params],
    queryFn: () => fetchAPIMobile<CurrenciesResponse>(endpoint, undefined, {
      ttl: 120000, // 2min cache
      staleWhileRevalidate: true,
      offlineFirst: true, // Currencies are relatively static
    }),
    staleTime: 60000, // 1 minute
    gcTime: 600000, // Keep in cache for 10 minutes
    ...options,
  });
};

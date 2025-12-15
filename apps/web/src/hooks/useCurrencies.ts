import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from './fetchAPI';
import type { CurrenciesResponse } from '@/types/currency.types';
import { logger } from '@/utils/prodLogger';

const log = logger.withContext({ hook: '[Limit Issue] useCurrencies' });

export interface UseCurrenciesParams {
  chainId?: number;
  limit?: number;
  offset?: number;
  tokenType?: 'underlying' | 'synthetic';
  onlyActual?: boolean;
}

export const useCurrencies = (params?: UseCurrenciesParams, options?: UseQueryOptions<CurrenciesResponse, Error>) => {
  const queryParams = new URLSearchParams();

  if (params?.chainId) queryParams.append('chainId', params.chainId.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.tokenType) queryParams.append('tokenType', params.tokenType);
  if (params?.onlyActual) queryParams.append('onlyActual', 'true');

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/currencies?${queryString}` : '/currencies';

  log.info('useCurrencies hook called', { params, endpoint, options });

  const result = useQuery({
    queryKey: ['currencies', params],
    queryFn: async () => {
      log.info('Fetching currencies', { endpoint });
      try {
        const data = await fetchAPI<CurrenciesResponse>(endpoint);
        log.info('Currencies fetched successfully', { count: data?.data?.length });
        return data;
      } catch (error) {
        log.error('Failed to fetch currencies', error, { endpoint });
        throw error;
      }
    },
    enabled: options?.enabled !== false, // Explicitly check if query should run
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });

  log.info('useCurrencies result', {
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    hasData: !!result.data,
    error: result.error?.message,
  });

  return result;
};

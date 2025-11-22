import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '../../../hooks/fetchAPI';
import type { CurrenciesResponse } from '../types/faucet.types';

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

  return useQuery({
    queryKey: ['currencies', params],
    queryFn: () => fetchAPI<CurrenciesResponse>(endpoint),
    ...options,
  });
};

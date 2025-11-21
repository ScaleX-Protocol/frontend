import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { fetchIndexer } from './fetchIndexer';
import type { CurrenciesResponse, CurrenciesParams, SingleCurrencyResponse } from '@/types/currencies.types';

export const useCurrencies = (
  params?: CurrenciesParams,
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
    queryFn: () => fetchIndexer<CurrenciesResponse>(endpoint),
    ...options,
  });
};

export const useCurrency = (
  address: string,
  options?: UseQueryOptions<SingleCurrencyResponse, Error>
) => {
  return useQuery({
    queryKey: ['currency', address],
    queryFn: () => fetchIndexer<SingleCurrencyResponse>(`/currencies/${address}`),
    enabled: !!address,
    ...options,
  });
};
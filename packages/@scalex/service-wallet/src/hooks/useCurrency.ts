import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@scalex/api-client';
import type { SingleCurrencyResponse } from '@scalex/types';

export const useCurrency = (address: string, options?: UseQueryOptions<SingleCurrencyResponse, Error>) => {
  return useQuery({
    queryKey: ['currency', address],
    queryFn: () => fetchAPI<SingleCurrencyResponse>(`/currencies/${address}`),
    enabled: !!address,
    ...options,
  });
};

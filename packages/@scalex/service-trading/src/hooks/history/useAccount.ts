import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AccountInfo } from '@scalex/types';
import { fetchIndexerAPI } from '@scalex/api-client';

export function useAccount(
  address: string,
  options?: Omit<UseQueryOptions<AccountInfo, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AccountInfo, Error>({
    queryKey: ['account', address] as const,
    queryFn: () => fetchIndexerAPI<AccountInfo>(`/account?address=${address}`),
    enabled: !!address,
    ...options,
  });
}

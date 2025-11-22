import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AccountInfo } from '../../types/history.types';
import { fetchIndexer } from '@/hooks/fetchIndexer';

export function useAccount(
  address: string,
  options?: Omit<UseQueryOptions<AccountInfo, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AccountInfo, Error>({
    queryKey: ['account', address] as const,
    queryFn: () => fetchIndexer<AccountInfo>(`/account?address=${address}`),
    enabled: !!address,
    ...options,
  });
}

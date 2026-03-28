import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AccountInfo } from '../../types/history.types';

export function useAccount(
  address: string,
  options?: Omit<UseQueryOptions<AccountInfo, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AccountInfo, Error>({
    queryKey: ['account', address] as const,
    queryFn: () => fetchAPI<AccountInfo>(`/account?address=${address}`),
    enabled: !!address && address !== 'Not Created',
    ...options,
  });
}

import { fetchAPI } from '@/hooks/fetchAPI';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AccountInfo } from '../../types/history.types';

export function useAccount(
  address: string,
  options?: Omit<UseQueryOptions<AccountInfo, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<AccountInfo, Error>({
    queryKey: ['account', address],
    queryFn: () => fetchAPI<AccountInfo>(`/account?address=${address}`),
    enabled: !!address,
    ...options,
  });
}

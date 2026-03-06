import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { PendingActionsResponse } from '../types/pending.types';

export function usePendingActions(address: string | undefined, chainId?: number) {
  return useQuery<PendingActionsResponse, Error>({
    queryKey: ['pendingActions', address, chainId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (chainId) params.set('chainId', String(chainId));
      const qs = params.toString();
      return fetchAPI<PendingActionsResponse>(`/predictions/pending/${address}${qs ? `?${qs}` : ''}`);
    },
    enabled: !!address,
    staleTime: 15_000,
  });
}

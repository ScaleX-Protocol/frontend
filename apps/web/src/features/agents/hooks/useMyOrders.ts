import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentOrdersResponse } from '../types/agents.types';

export function useMyOrders(ownerAddress: string | undefined, options?: { status?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (ownerAddress) params.set('owner', ownerAddress);
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', String(options.limit));
  const qs = params.toString();

  return useQuery<AgentOrdersResponse, Error>({
    queryKey: ['myOrders', ownerAddress, options],
    queryFn: () => fetchAPI<AgentOrdersResponse>(`/agent-orders${qs ? `?${qs}` : ''}`),
    enabled: !!ownerAddress,
    staleTime: 15_000,
  });
}

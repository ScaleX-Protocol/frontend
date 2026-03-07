import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentOrdersResponse } from '../types/agents.types';

export function useAgentOrders(
  agentTokenId: string | undefined,
  options?: { status?: string; owner?: string; limit?: number; offset?: number },
) {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.owner) params.set('owner', options.owner);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  const qs = params.toString();

  return useQuery<AgentOrdersResponse, Error>({
    queryKey: ['agentOrders', agentTokenId, options],
    queryFn: () => fetchAPI<AgentOrdersResponse>(`/agents/${agentTokenId}/orders${qs ? `?${qs}` : ''}`),
    enabled: !!agentTokenId,
    staleTime: 15_000,
  });
}

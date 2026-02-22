import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { AgentOrdersResponse } from '../types/agents.types';

export function useAgentOrders(agentTokenId: string | undefined, options?: { status?: string; limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  const qs = params.toString();

  return useQuery<AgentOrdersResponse, Error>({
    queryKey: ['agentOrders', agentTokenId, options],
    queryFn: () => fetchIndexerAPI<AgentOrdersResponse>(`/agents/${agentTokenId}/orders${qs ? `?${qs}` : ''}`),
    enabled: !!agentTokenId,
    staleTime: 15_000,
  });
}

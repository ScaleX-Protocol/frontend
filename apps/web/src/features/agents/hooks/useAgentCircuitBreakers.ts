import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentCircuitBreakersResponse } from '../types/agents.types';

export function useAgentCircuitBreakers(agentTokenId: string | undefined) {
  return useQuery<AgentCircuitBreakersResponse, Error>({
    queryKey: ['agentCircuitBreakers', agentTokenId],
    queryFn: () => fetchAPI<AgentCircuitBreakersResponse>(`/agents/${agentTokenId}/circuit-breakers`),
    enabled: !!agentTokenId,
    staleTime: 60_000,
  });
}

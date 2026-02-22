import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { AgentCircuitBreakersResponse } from '../types/agents.types';

export function useAgentCircuitBreakers(agentTokenId: string | undefined) {
  return useQuery<AgentCircuitBreakersResponse, Error>({
    queryKey: ['agentCircuitBreakers', agentTokenId],
    queryFn: () => fetchIndexerAPI<AgentCircuitBreakersResponse>(`/agents/${agentTokenId}/circuit-breakers`),
    enabled: !!agentTokenId,
    staleTime: 60_000,
  });
}

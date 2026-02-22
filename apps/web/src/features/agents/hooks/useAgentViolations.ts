import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { AgentViolationsResponse } from '../types/agents.types';

export function useAgentViolations(agentTokenId: string | undefined) {
  return useQuery<AgentViolationsResponse, Error>({
    queryKey: ['agentViolations', agentTokenId],
    queryFn: () => fetchIndexerAPI<AgentViolationsResponse>(`/agents/${agentTokenId}/violations`),
    enabled: !!agentTokenId,
    staleTime: 60_000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentViolationsResponse } from '../types/agents.types';

export function useAgentViolations(agentTokenId: string | undefined) {
  return useQuery<AgentViolationsResponse, Error>({
    queryKey: ['agentViolations', agentTokenId],
    queryFn: () => fetchAPI<AgentViolationsResponse>(`/agents/${agentTokenId}/violations`),
    enabled: !!agentTokenId,
    staleTime: 60_000,
  });
}

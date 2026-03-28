import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentStatsResponse } from '../types/agents.types';

export function useAgentStats(agentTokenId: string | undefined) {
  return useQuery<AgentStatsResponse, Error>({
    queryKey: ['agentStats', agentTokenId],
    queryFn: () => fetchAPI<AgentStatsResponse>(`/agents/${agentTokenId}/stats`),
    enabled: !!agentTokenId,
    staleTime: 30_000,
  });
}

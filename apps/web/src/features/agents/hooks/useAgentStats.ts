import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { AgentStatsResponse } from '../types/agents.types';

export function useAgentStats(agentTokenId: string | undefined) {
  return useQuery<AgentStatsResponse, Error>({
    queryKey: ['agentStats', agentTokenId],
    queryFn: () => fetchIndexerAPI<AgentStatsResponse>(`/agents/${agentTokenId}/stats`),
    enabled: !!agentTokenId,
    staleTime: 30_000,
  });
}

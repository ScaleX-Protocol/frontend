import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { AgentAnalyticsResponse } from '../types/agents.types';

export function useAgentAnalytics(agentTokenId: string | undefined) {
  return useQuery<AgentAnalyticsResponse, Error>({
    queryKey: ['agentAnalytics', agentTokenId],
    queryFn: () => fetchIndexerAPI<AgentAnalyticsResponse>(`/agents/${agentTokenId}/analytics`),
    enabled: !!agentTokenId,
    staleTime: 60_000,
  });
}

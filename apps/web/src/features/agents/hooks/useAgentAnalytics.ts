import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentAnalyticsResponse } from '../types/agents.types';

export function useAgentAnalytics(agentTokenId: string | undefined) {
  return useQuery<AgentAnalyticsResponse, Error>({
    queryKey: ['agentAnalytics', agentTokenId],
    queryFn: () => fetchAPI<AgentAnalyticsResponse>(`/agents/${agentTokenId}/analytics`),
    enabled: !!agentTokenId,
    staleTime: 60_000,
  });
}

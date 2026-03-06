import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentUsersResponse } from '../types/agents.types';

export function useAgentUsers(agentTokenId: string | undefined) {
  return useQuery<AgentUsersResponse, Error>({
    queryKey: ['agentUsers', agentTokenId],
    queryFn: () => fetchAPI<AgentUsersResponse>(`/agents/${agentTokenId}/users`),
    enabled: !!agentTokenId,
    staleTime: 30_000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentLendingResponse } from '../types/agents.types';

export function useAgentLending(agentTokenId: string | undefined) {
  return useQuery<AgentLendingResponse, Error>({
    queryKey: ['agentLending', agentTokenId],
    queryFn: () => fetchAPI<AgentLendingResponse>(`/agents/${agentTokenId}/lending`),
    enabled: !!agentTokenId,
    staleTime: 30_000,
  });
}

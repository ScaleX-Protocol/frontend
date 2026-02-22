import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { AgentLendingResponse } from '../types/agents.types';

export function useAgentLending(agentTokenId: string | undefined) {
  return useQuery<AgentLendingResponse, Error>({
    queryKey: ['agentLending', agentTokenId],
    queryFn: () => fetchIndexerAPI<AgentLendingResponse>(`/agents/${agentTokenId}/lending`),
    enabled: !!agentTokenId,
    staleTime: 30_000,
  });
}

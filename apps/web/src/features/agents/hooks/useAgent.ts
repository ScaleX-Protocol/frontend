import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { AgentDetailResponse } from '../types/agents.types';

export function useAgent(agentTokenId: string | undefined) {
  return useQuery<AgentDetailResponse, Error>({
    queryKey: ['agent', agentTokenId],
    queryFn: () => fetchIndexerAPI<AgentDetailResponse>(`/agents/${agentTokenId}`),
    enabled: !!agentTokenId,
    staleTime: 30_000,
  });
}

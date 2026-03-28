import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentDetailResponse } from '../types/agents.types';

export function useAgent(agentTokenId: string | undefined) {
  return useQuery<AgentDetailResponse, Error>({
    queryKey: ['agent', agentTokenId],
    queryFn: () => fetchAPI<AgentDetailResponse>(`/agents/${agentTokenId}`),
    enabled: !!agentTokenId,
    staleTime: 30_000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentPolicyResponse } from '../types/agents.types';

export function useAgentPolicy(agentTokenId: string | undefined, owner?: string) {
  const params = new URLSearchParams();
  if (owner) params.set('owner', owner);
  const qs = params.toString();

  return useQuery<AgentPolicyResponse, Error>({
    queryKey: ['agentPolicy', agentTokenId, owner],
    queryFn: () => fetchAPI<AgentPolicyResponse>(`/agents/${agentTokenId}/policy${qs ? `?${qs}` : ''}`),
    enabled: !!agentTokenId,
    staleTime: 30_000,
  });
}

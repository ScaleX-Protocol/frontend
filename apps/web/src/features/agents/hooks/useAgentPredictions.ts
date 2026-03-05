import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentPredictionsResponse } from '../types/agents.types';

export function useAgentPredictions(
  agentTokenId: string | undefined,
  options?: { action?: 'PREDICT' | 'CLAIM'; limit?: number; offset?: number }
) {
  const params = new URLSearchParams();
  if (options?.action) params.set('action', options.action);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  const queryString = params.toString();

  return useQuery<AgentPredictionsResponse, Error>({
    queryKey: ['agentPredictions', agentTokenId, options],
    queryFn: () => fetchAPI<AgentPredictionsResponse>(
      `/agents/${agentTokenId}/predictions${queryString ? `?${queryString}` : ''}`
    ),
    enabled: !!agentTokenId,
    staleTime: 30_000,
  });
}

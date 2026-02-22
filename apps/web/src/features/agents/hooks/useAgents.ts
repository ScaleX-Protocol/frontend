import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { AgentsResponse } from '../types/agents.types';

export function useAgents() {
  return useQuery<AgentsResponse, Error>({
    queryKey: ['agents'],
    queryFn: () => fetchIndexerAPI<AgentsResponse>('/agents'),
    staleTime: 30_000,
  });
}

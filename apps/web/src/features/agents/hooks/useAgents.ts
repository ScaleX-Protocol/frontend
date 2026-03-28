import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { AgentsResponse } from '../types/agents.types';

export function useAgents() {
  return useQuery<AgentsResponse, Error>({
    queryKey: ['agents'],
    queryFn: () => fetchAPI<AgentsResponse>('/agents'),
    staleTime: 30_000,
  });
}

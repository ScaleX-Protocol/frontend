import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { MyAgentsResponse } from '../types/agents.types';

export function useMyAgents(ownerAddress: string | undefined) {
  return useQuery<MyAgentsResponse, Error>({
    queryKey: ['myAgents', ownerAddress],
    queryFn: () => fetchAPI<MyAgentsResponse>(`/agents?owner=${ownerAddress}`),
    enabled: !!ownerAddress,
    staleTime: 15_000,
  });
}

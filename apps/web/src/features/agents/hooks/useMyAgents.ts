import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { MyAgentsResponse } from '../types/agents.types';

export function useMyAgents(ownerAddress: string | undefined) {
  return useQuery<MyAgentsResponse, Error>({
    queryKey: ['myAgents', ownerAddress],
    queryFn: () => fetchIndexerAPI<MyAgentsResponse>(`/agents?owner=${ownerAddress}`),
    enabled: !!ownerAddress,
    staleTime: 15_000,
  });
}

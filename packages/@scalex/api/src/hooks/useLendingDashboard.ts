import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client/api-client';
import { getLendingDashboard } from '../services/lending.service';

export function useLendingDashboard(user: string, chainId?: number) {
  return useQuery({
    queryKey: ['lendingDashboard', user, chainId],
    queryFn: () => getLendingDashboard(apiClient, user, chainId),
    enabled: !!user,
    staleTime: 30000, // 30 detik cache
  });
}
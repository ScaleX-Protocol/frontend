import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client/api-client';
import { TradingService } from '../services/trading.service';

export function useAccount(user: string) {
  return useQuery({
    queryKey: ['account', user],
    queryFn: () => TradingService.getAccount(apiClient, user),
    enabled: !!user,
    staleTime: 30000,
  });
}
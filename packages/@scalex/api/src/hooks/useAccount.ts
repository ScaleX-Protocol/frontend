import { useQuery } from '@tanstack/react-query';
import { defaultClient } from '../client/indexer-client';
import { TradingService } from '../services/trading.service';

export function useAccount(user: string) {
  return useQuery({
    queryKey: ['account', user],
    queryFn: () => TradingService.getAccount(defaultClient, user),
    enabled: !!user,
    staleTime: 30000,
  });
}
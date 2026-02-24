import { useQuery } from '@tanstack/react-query';
import { defaultClient } from '../client/indexer-client';
import { TradingService } from '../services/trading.service';

export function useAllOrders(symbol: string, user: string) {
  return useQuery({
    queryKey: ['allOrders', user, symbol],
    queryFn: () => TradingService.getAllOrders(defaultClient, user, symbol),
    enabled: !!user,
    staleTime: 30000, // 30 detik cache
  });
}
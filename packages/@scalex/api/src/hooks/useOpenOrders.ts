import { useQuery } from '@tanstack/react-query';
import { defaultClient } from '../client/indexer-client';
import { TradingService } from '../services/trading.service';

export function useOpenOrders(symbol: string, user: string) {
  return useQuery({
    queryKey: ['openOrders', symbol, user],
    queryFn: () => TradingService.getOpenOrders(defaultClient, symbol, user),
    enabled: !!user,
    staleTime: 30000, // 30 detik cache
  });
}
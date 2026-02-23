import { useQuery } from '@tanstack/react-query';
import { defaultClient } from '../client/indexer-client';
import { TradingService } from '../services/trading.service';

export function useTrades(symbol: string, limit = 50) {
  return useQuery({
    queryKey: ['trades', symbol, limit],
    queryFn: () => TradingService.getTrades(defaultClient, symbol, limit),
    enabled: !!symbol,
    staleTime: 10_000,
  });
}

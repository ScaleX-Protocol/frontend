import { useQuery } from '@tanstack/react-query';
import { defaultClient } from '../client/indexer-client';
import { TradingService } from '../services/trading.service';

export function useKlines(symbol: string, interval: string, limit = 500) {
  return useQuery({
    queryKey: ['klines', symbol, interval, limit],
    queryFn: () => TradingService.getKlines(defaultClient, symbol, interval, limit),
    enabled: !!symbol && !!interval,
    staleTime: 60_000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { defaultClient } from '../client/indexer-client';
import { TradingService } from '../services/trading.service';

export function useTicker24hr(symbol: string) {
  return useQuery({
    queryKey: ['ticker24h', symbol],
    queryFn: () => TradingService.getTicker24hr(defaultClient, symbol),
    enabled: !!symbol,
    staleTime: 10_000,
  });
}

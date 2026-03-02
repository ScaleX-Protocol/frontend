import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client/api-client';
import { TradingService } from '../services/trading.service';

export function useTrades(symbol: string, limit = 50) {
  return useQuery({
    queryKey: ['trades', symbol, limit],
    queryFn: () => TradingService.getTrades(apiClient, symbol, limit),
    enabled: !!symbol,
    staleTime: 10_000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client/api-client';
import { TradingService } from '../services/trading.service';

export function useOpenOrders(symbol: string, user: string) {
  return useQuery({
    queryKey: ['openOrders', symbol, user],
    queryFn: () => TradingService.getOpenOrders(apiClient, symbol, user),
    enabled: !!user,
    staleTime: 30000, // 30 detik cache
  });
}
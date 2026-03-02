import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client/api-client';
import { TradingService } from '../services/trading.service';

export function useAllOrders(symbol: string, user: string) {
  return useQuery({
    queryKey: ['allOrders', user, symbol],
    queryFn: () => TradingService.getAllOrders(apiClient, user, symbol),
    enabled: !!user,
    staleTime: 30000, // 30 detik cache
  });
}
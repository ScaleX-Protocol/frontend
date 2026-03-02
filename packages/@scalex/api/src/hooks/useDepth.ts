import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TradingService } from '../services/trading.service';
import { apiClient } from '../client/api-client';

export function useDepth(symbol: string, limit: number) {
  const queryKey = ['orderbook', symbol, limit];

  const query = useQuery({
    queryKey,
    queryFn: () => TradingService.getDepth(apiClient, symbol, limit),
    staleTime: Infinity, // Kita biarkan WS yang mengupdate datanya
  });  

  return query;
}
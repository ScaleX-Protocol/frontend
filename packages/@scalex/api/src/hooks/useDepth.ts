import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TradingService } from '../services/trading.service';
import { defaultClient } from '../client/indexer-client';

export function useDepth(symbol: string, limit: number) {
  const queryKey = ['orderbook', symbol, limit];

  const query = useQuery({
    queryKey,
    queryFn: () => TradingService.getDepth(defaultClient, symbol, limit),
    staleTime: Infinity, // Kita biarkan WS yang mengupdate datanya
  });  

  return query;
}
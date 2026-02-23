import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TradingService } from '../services/trading.service';
import { defaultClient } from '../client/indexer-client';

export function useOrderBook(symbol: string) {
  const queryKey = ['orderbook', symbol];

  const query = useQuery({
    queryKey,
    queryFn: () => TradingService.getOrderBook(defaultClient, symbol),
    staleTime: Infinity, // Kita biarkan WS yang mengupdate datanya
  });  

  return query;
}
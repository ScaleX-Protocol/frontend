import { useQuery } from "@tanstack/react-query";
import { defaultClient } from "../client/indexer-client";
import { TradingService } from "../services/trading.service";

export function useMarkets() {
    return useQuery({
      queryKey: ['markets'],
      queryFn: () => TradingService.getMarkets(defaultClient),
      staleTime: 30000,
    });
}
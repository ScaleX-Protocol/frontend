import { useQuery } from "@tanstack/react-query";
import { defaultClient } from "../client/indexer-client";
import { TradingService } from "../services/trading.service";

export function usePairs() {
    return useQuery({
      queryKey: ['pairs'],
      queryFn: () => TradingService.getPairs(defaultClient),
      staleTime: 30000,
    });
}
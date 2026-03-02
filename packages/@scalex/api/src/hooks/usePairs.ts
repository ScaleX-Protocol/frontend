import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client/api-client";
import { TradingService } from "../services/trading.service";

export function usePairs() {
    return useQuery({
      queryKey: ['pairs'],
      queryFn: () => TradingService.getPairs(apiClient),
      staleTime: 30000,
    });
}
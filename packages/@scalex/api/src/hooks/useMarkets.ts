import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client/api-client";
import { TradingService } from "../services/trading.service";

export function useMarkets() {
    return useQuery({
      queryKey: ['markets'],
      queryFn: () => TradingService.getMarkets(apiClient),
      staleTime: 30000,
    });
}
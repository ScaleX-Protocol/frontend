import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client/api-client";
import { CommonService } from "../services/common.service";

export function useTickerPrice(symbol : string) {
    return useQuery({
      queryKey: ['tickerPrice', symbol],
      queryFn: () => CommonService.getTickerPrice(apiClient, symbol),
      staleTime: 30000,
    });
}
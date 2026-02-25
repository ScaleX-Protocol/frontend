import { useQuery } from "@tanstack/react-query";
import { defaultClient } from "../client/indexer-client";
import { CommonService } from "../services/common.service";

export function useTickerPrice(symbol : string) {
    return useQuery({
      queryKey: ['tickerPrice', symbol],
      queryFn: () => CommonService.getTickerPrice(defaultClient, symbol),
      staleTime: 30000,
    });
}
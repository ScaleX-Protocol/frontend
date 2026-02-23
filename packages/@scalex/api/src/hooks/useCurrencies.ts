import { useQuery } from "@tanstack/react-query";
import { defaultClient } from "../client/indexer-client";
import { CommonService } from "../services/common.service";

export function useCurrencies() {
    return useQuery({
      queryKey: ['currencies'],
      queryFn: () => CommonService.getCurrencies(defaultClient),
      staleTime: 30000,
    });
}
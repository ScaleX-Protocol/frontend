import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client/api-client";
import { CommonService } from "../services/common.service";

export function useCurrencies() {
    return useQuery({
      queryKey: ['currencies'],
      queryFn: () => CommonService.getCurrencies(apiClient),
      staleTime: 30000,
    });
}
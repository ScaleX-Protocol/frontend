import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { LendingDashboard } from "../types/lending.types";
import { fetchAPI } from "@/hooks/fetchAPI";

export interface UseLendingDashboardParams {
  user: string;
  chainId?: number;
}

export function useLendingDashboard(
  params: UseLendingDashboardParams,
  options?: Omit<
    UseQueryOptions<LendingDashboard, Error>,
    "queryKey" | "queryFn"
  >
) {
  const { user, chainId } = params;

  return useQuery<LendingDashboard, Error>({
    queryKey: ["lendingDashboard", user, chainId],
    queryFn: () => {
      const queryParams = chainId ? `?chainId=${chainId}` : "";
      return fetchAPI<LendingDashboard>(
        `/lending/dashboard/${user}${queryParams}`
      );
    },
    enabled: !!user,
    ...options,
  });
}

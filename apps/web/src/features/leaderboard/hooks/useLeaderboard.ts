import { useQuery } from "@tanstack/react-query";
import { fetchAgentAPI } from "@/hooks/fetchAgentAPI";
import type {
  LeaderboardResponse,
  LeaderboardType,
  LeaderboardSortBy,
  LeaderboardWindow,
  AgentLeaderboardEntry,
  AgentMetadata,
} from "../types/leaderboard.types";

interface UseLeaderboardParams {
  type?: LeaderboardType;
  sortBy: LeaderboardSortBy;
  window: LeaderboardWindow;
  chainId?: number;
  limit?: number;
  offset?: number;
}

// Fetch metadata for a single agent
async function fetchAgentMetadata(
  metadataUri: string
): Promise<AgentMetadata | null> {
  try {
    const response = await fetch(metadataUri);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      name: data.name || null,
      image: data.image || null,
      description: data.description || null,
    };
  } catch {
    return null;
  }
}

// Fetch leaderboard and enrich agent entries with metadata
async function fetchLeaderboardWithMetadata(
  searchParams: URLSearchParams,
  type?: LeaderboardType
): Promise<LeaderboardResponse> {
  const response = await fetchAgentAPI<LeaderboardResponse>(
    `/leaderboard?${searchParams}`
  );

  // If fetching agents, enrich with metadata
  if (type === "agent" && response.data.length > 0) {
    const enrichedData = await Promise.all(
      response.data.map(async (entry) => {
        if (entry.type === "agent") {
          const agentEntry = entry as AgentLeaderboardEntry;
          if (agentEntry.metadataUri) {
            const metadata = await fetchAgentMetadata(agentEntry.metadataUri);
            return { ...agentEntry, metadata };
          }
        }
        return entry;
      })
    );
    return { ...response, data: enrichedData };
  }

  return response;
}

export function useLeaderboard(params: UseLeaderboardParams) {
  const {
    type,
    sortBy,
    window,
    chainId = 84532,
    limit = 10,
    offset = 0,
  } = params;

  const search = new URLSearchParams({
    sortBy,
    window,
    chainId: String(chainId),
    limit: String(limit),
    offset: String(offset),
  });
  if (type) search.set("type", type);

  return useQuery<LeaderboardResponse, Error>({
    queryKey: ["leaderboard", type, sortBy, window, chainId, limit, offset],
    queryFn: () => fetchLeaderboardWithMetadata(search, type),
    staleTime: 30_000,
  });
}

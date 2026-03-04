export type LeaderboardType = "user" | "agent";
export type LeaderboardSortBy = "pnl" | "volume" | "managed_users";
export type LeaderboardWindow = "24h" | "7d" | "30d" | "all";

export interface UserLeaderboardEntry {
  rank: number;
  type: "user";
  address: string;
  realizedPnl: string;
  totalVolume: string;
  winRate: number;
  fillRate: number;
  totalTrades: number;
}

export interface AgentMetadata {
  name: string | null;
  image: string | null;
  description: string | null;
}

export interface AgentLeaderboardEntry {
  rank: number;
  type: "agent";
  agentTokenId: string;
  metadataUri: string | null;
  metadata: AgentMetadata | null;
  realizedPnl: string;
  totalVolume: string;
  managedUsers: number;
  winRate: number;
  fillRate: number;
  totalTrades: number;
}

export type LeaderboardEntry = UserLeaderboardEntry | AgentLeaderboardEntry;

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  count: number;
  pagination: { limit: number; offset: number };
}

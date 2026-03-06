export type ActivityType = 'trading' | 'lending' | 'agent' | 'prediction' | 'transfer';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  subtype: string;
  timestamp: number;
  amount: string;
  tokenSymbol: string | null;
  tokenAddress: string;
  transactionId: string | null;
  chainId: number;
  isAgent: boolean;
  agentTokenId: string | null;
  metadata: Record<string, unknown>;
}

export interface ActivityResponse {
  success: boolean;
  data: ActivityItem[];
  count: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export type ActivityFilter = 'all' | ActivityType;
export type TimePeriodFilter = '24h' | '7d' | '30d' | 'all';

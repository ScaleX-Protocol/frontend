export interface AgentMarketplaceItem {
  agentTokenId: string;
  owner?: string;
  metadataURI?: string;
  registeredAt?: number;
  totalUsers: number;
  activeUsers: number;
  firstInstalledAt: string | null;
  lastActivityAt: number | null;
  totalTradingVolume?: string;
  totalMarketOrders?: number;
  totalLimitOrders?: number;
  totalOrdersFilled?: number;
  totalOrders?: number;
  totalVolume?: string;
  totalPredictions?: number;
  totalPredictionVolume?: string;
  totalPredictionClaims?: number;
}

export interface AgentsResponse {
  success: boolean;
  data: AgentMarketplaceItem[];
  totalAgents: number;
}

export interface AgentPolicy {
  templateUsed: string;
  enabled: boolean;
  installedAt: string;
  expiryTimestamp: string;
  lastUpdatedAt: number;
  maxOrderSize: string;
  minOrderSize: string;
  whitelistedTokens: string[];
  blacklistedTokens: string[];
  allowMarketOrders: boolean;
  allowLimitOrders: boolean;
  allowSwap: boolean;
  allowBorrow: boolean;
  allowRepay: boolean;
  allowSupplyCollateral: boolean;
  allowWithdrawCollateral: boolean;
  allowPlaceLimitOrder: boolean;
  allowCancelOrder: boolean;
  allowBuy: boolean;
  allowSell: boolean;
  allowAutoBorrow: boolean;
  maxAutoBorrowAmount: string;
  allowAutoRepay: boolean;
  minDebtToRepay: string;
  minHealthFactor: string;
  maxSlippageBps: string;
  minTimeBetweenTrades: string;
  emergencyRecipient: string;
  dailyVolumeLimit: string;
  weeklyVolumeLimit: string;
  maxDailyDrawdown: string;
  maxWeeklyDrawdown: string;
  maxTradeVsTVLBps: string;
  minWinRateBps: string;
  minSharpeRatio: string;
  maxPositionConcentrationBps: string;
  maxCorrelationBps: string;
  maxTradesPerDay: string;
  maxTradesPerHour: string;
  tradingStartHour: string;
  tradingEndHour: string;
  minReputationScore: string;
  useReputationMultiplier: boolean;
  requiresChainlinkFunctions: boolean;
}

export interface AgentInstallation {
  id: string;
  chainId: number;
  owner: string;
  agentTokenId: string;
  templateUsed: string;
  enabled: boolean;
  installedAt: number;
  uninstalledAt: number | null;
  transactionId: string;
  blockNumber: string;
  policy: AgentPolicy;
}

export interface AgentDetailResponse {
  success: boolean;
  data: {
    agentTokenId: string;
    totalUsers: number;
    activeUsers: number;
    firstInstalledAt: string;
    lastActivityAt: number | null;
    aggregateStats: {
      totalMarketOrders: number;
      totalLimitOrders: number;
      totalOrdersCancelled: number;
      totalTradingVolume: string;
      totalBorrowAmount: string;
      totalRepayAmount: string;
      totalCollateralSupplied: string;
      totalCollateralWithdrawn: string;
      totalPredictions: number;
      totalPredictionVolume: string;
      totalPredictionClaims: number;
    };
    ordersByStatus: Record<string, number>;
  };
}

export interface AgentAnalyticsData {
  agentTokenId: string;
  totalOrders: number;
  filledOrders: number;
  cancelledOrders: number;
  openOrders: number;
  fillRate: number;
  winRate: number;
  totalPnL: string;
  realizedPnL: string;
  unrealizedPnL: string;
  totalVolume: string;
  avgOrderSize: string;
}

export interface AgentAnalyticsResponse {
  success: boolean;
  data: AgentAnalyticsData;
}

export interface AgentStatsData {
  agentStats: {
    id: string;
    chainId: number;
    owner: string;
    agentTokenId: string;
    totalMarketOrders: number;
    totalLimitOrders: number;
    totalOrdersCancelled: number;
    totalTradingVolume: string;
    totalBorrowAmount: string;
    totalRepayAmount: string;
    totalCollateralSupplied: string;
    totalCollateralWithdrawn: string;
    firstActivityTimestamp: number;
    lastActivityTimestamp: number;
    isActive: boolean;
  };
  ordersByStatus: Record<string, number>;
}

export interface AgentStatsResponse {
  success: boolean;
  data: AgentStatsData;
}

export interface AgentOrder {
  id: string;
  chainId: number;
  poolId: string;
  orderId: string;
  transactionId: string;
  userAddress: string;
  side: string;
  timestamp: number;
  price: string;
  quantity: string;
  filled: string;
  type: string;
  status: string;
  expiry: number;
  autoRepay: boolean;
  autoBorrow: boolean;
  timeInForce: string;
  quoteQuantity: string;
  executedQuoteQuantity: string;
  agentTokenId: string;
  executor: string;
}

export interface AgentOrdersResponse {
  success: boolean;
  data: AgentOrder[];
  count: number;
  pagination: { limit: number; offset: number };
}

export interface AgentLendingEvent {
  id: string;
  chainId: number;
  agentTokenId: string;
  owner: string;
  eventType: string;
  token: string;
  amount: string;
  timestamp: number;
  transactionId: string;
}

export interface AgentLendingResponse {
  success: boolean;
  data: AgentLendingEvent[];
  count: number;
  pagination: { limit: number; offset: number };
}

export interface AgentViolation {
  id: string;
  chainId: number;
  agentTokenId: string;
  owner: string;
  violationType: string;
  details: string;
  timestamp: number;
  transactionId: string;
}

export interface AgentViolationsResponse {
  success: boolean;
  data: AgentViolation[];
  count: number;
  pagination: { limit: number; offset: number };
}

export interface AgentCircuitBreaker {
  id: string;
  chainId: number;
  agentTokenId: string;
  owner: string;
  breakerType: string;
  reason: string;
  timestamp: number;
  transactionId: string;
}

export interface AgentCircuitBreakersResponse {
  success: boolean;
  data: AgentCircuitBreaker[];
  count: number;
  pagination: { limit: number; offset: number };
}

export interface AgentPolicyResponse {
  success: boolean;
  data: AgentInstallation | AgentInstallation[];
  count?: number;
  pagination?: { limit: number; offset: number };
}

export interface MyAgentsResponse {
  success: boolean;
  data: AgentInstallation[];
  count: number;
  pagination: { limit: number; offset: number };
}

export interface AgentPredictionEvent {
  id: string;
  chainId: number;
  owner: string;
  agentTokenId: string;
  executor: string;
  action: 'PREDICT' | 'CLAIM';
  marketId: string;
  predictUp: boolean | null;
  amount: string;
  timestamp: number;
  transactionId: string;
  blockNumber: string;
  market: {
    baseToken: string;
    strikePrice: string;
    status: number;
    outcome: boolean | null;
    endTime: number;
  } | null;
}

export interface AgentPredictionsResponse {
  success: boolean;
  data: AgentPredictionEvent[];
  count: number;
  pagination: { limit: number; offset: number };
}

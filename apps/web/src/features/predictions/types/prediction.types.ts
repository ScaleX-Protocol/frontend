// Market type matching the contract enum
export enum MarketType {
  Directional = 0, // UP/DOWN vs opening TWAP
  Absolute = 1,    // Above/Below a strike price
}

// Market status matching the contract enum
export enum MarketStatus {
  Open = 0,
  SettlementRequested = 1,
  Settled = 2,
  Cancelled = 3,
}

export interface PredictionMarket {
  id: string;
  chainId: number;
  marketId: string;
  marketType: MarketType;
  status: MarketStatus;
  baseToken: string;
  strikePrice: string;
  openingTwap: string;
  startTime: number;
  endTime: number;
  totalUp: string;
  totalDown: string;
  outcome: boolean | null;
  protocolFee: string | null;
  transactionId: string | null;
}

export interface PredictionPosition {
  id: string;
  chainId: number;
  marketId: string;
  userAddress: string;
  stakeUp: string;
  stakeDown: string;
  claimed: boolean;
  payout: string | null;
  lastUpdated: number;
}

export interface PredictionMarketsResponse {
  markets: PredictionMarket[];
  count: number;
}

export interface PredictionPositionsResponse {
  positions: PredictionPosition[];
  count: number;
}

export interface MarketDetailResponse {
  market: PredictionMarket;
  participantCount: number;
}

export interface PredictionEvent {
  id: string;
  chainId: number;
  marketId: string;
  eventType: string;
  userAddress: string | null;
  amount: string | null;
  predictedUp: boolean | null;
  outcome: boolean | null;
  payout: string | null;
  timestamp: number;
  transactionId: string;
  blockNumber: string;
  agentTokenId: string | null;
  agentExecutor: string | null;
}

export interface PredictionEventsResponse {
  events: PredictionEvent[];
  count: number;
}

export interface PredictionStatsResponse {
  totalMarkets: number;
  activeMarkets: number;
  settledMarkets: number;
  cancelledMarkets: number;
  totalVolumeUp: string;
  totalVolumeDown: string;
  uniqueParticipants: number;
}

export interface PendingMarket {
  marketId: string;
  chainId: number;
  baseToken: string;
  baseTokenSymbol: string | null;
  strikePrice: string;
  endTime: number;
  settlementRequestedAt: number | null;
  userStakeUp: string;
  userStakeDown: string;
  isAgentPosition: boolean;
  agentTokenId: string | null;
}

export interface ClaimablePosition {
  marketId: string;
  chainId: number;
  baseToken: string;
  baseTokenSymbol: string | null;
  strikePrice: string;
  outcome: boolean;
  userStakeUp: string;
  userStakeDown: string;
  payout: string | null;
  isAgentPosition: boolean;
  agentTokenId: string | null;
}

export interface PendingActionsResponse {
  success: boolean;
  data: {
    awaitingSettlement: PendingMarket[];
    claimable: ClaimablePosition[];
  };
  count: number;
}

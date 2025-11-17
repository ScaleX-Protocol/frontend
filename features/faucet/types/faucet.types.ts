export type HexAddress = `0x${string}`;

export interface FaucetToken {
  token: HexAddress;
  symbol: string;
  decimals: number;
  name: string;
  totalSupply: string;
  isActive: boolean;
}

export interface FaucetRequest {
  id: string;
  user: HexAddress;
  token: HexAddress;
  tokenSymbol: string;
  amount: string;
  timestamp: string;
  txHash: HexAddress;
  status: 'pending' | 'completed' | 'failed';
  blockNumber: number;
}

export interface UserBalance {
  token: HexAddress;
  balance: string;
  decimals: number;
}

export interface FaucetConfig {
  cooldownPeriod: number; // in seconds
  requestAmount: string;
  maxDailyRequests: number;
  isActive: boolean;
}

export interface FaucetStats {
  totalRequests: number;
  totalTokensDistributed: string;
  uniqueUsers: number;
  activeTokens: number;
}

export interface FaucetTokensResponse {
  faucetTokenss: {
    items: FaucetToken[];
    totalCount: number;
  };
}

export interface FaucetRequestsResponse {
  faucetRequestss: {
    items: FaucetRequest[];
    totalCount: number;
  };
}

export interface BalanceResponse {
  balance: string;
}

export interface LastRequestTimeResponse {
  timestamp: number;
}

export interface FaucetCooldownResponse {
  cooldown: number;
}

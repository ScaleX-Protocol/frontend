export type HexAddress = `0x${string}`;

export interface FaucetRequest {
  address: string;
  tokenAddress: string;
}

export interface FaucetHistoryItem {
  id: number;
  chainId: number;
  requesterAddress: string;
  receiverAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  amount: string;
  amountFormatted: string;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  gasUsed?: string;
  gasPrice?: string;
  errorMessage?: string;
  requestTimestamp: string;
  completedTimestamp?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface FaucetHistoryResponse {
  success: boolean;
  data: FaucetHistoryItem[];
  count: number;
  timestamp: number;
  error?: string;
}

export interface FaucetAddressResponse {
  success: boolean;
  chainId: number;
  faucetAddress?: string;
  timestamp: number;
  error?: string;
}

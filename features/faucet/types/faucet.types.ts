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

export interface Currency {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  tokenType: 'underlying' | 'synthetic';
  sourceChainId?: number | null;
  underlyingTokenAddress?: string | null;
  isActive: boolean;
  registeredAt: number;
}

export interface CurrenciesResponse {
  success: boolean;
  message: string;
  data: {
    items: Currency[];
    total: number;
    limit: number;
    offset: number;
    filters: {
      chainId?: number;
      tokenType?: 'underlying' | 'synthetic';
      onlyActual?: boolean;
    };
  };
}

export interface SingleCurrencyResponse {
  success: boolean;
  message: string;
  data: Currency;
}

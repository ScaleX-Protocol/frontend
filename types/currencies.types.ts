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

export interface CurrenciesParams {
  chainId?: number;
  limit?: number;
  offset?: number;
  tokenType?: 'underlying' | 'synthetic';
  onlyActual?: boolean;
}

export interface SingleCurrencyResponse {
  success: boolean;
  message: string;
  data: Currency;
}
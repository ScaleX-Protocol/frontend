export interface Currency {
  id?: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId?: number;
  tokenType?: 'underlying' | 'synthetic' | 'native';
  sourceChainId?: number | null;
  underlyingTokenAddress?: string | null;
  isActive?: boolean;
  registeredAt?: number;
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

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  tokenType?: 'underlying' | 'synthetic' | 'native';
  underlyingTokenAddress?: string | null;
  chainId?: number;
  sourceChainId?: number | null;
}

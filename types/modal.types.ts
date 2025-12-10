export interface Currency {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  tokenType?: 'underlying' | 'synthetic' | 'native';
  underlyingTokenAddress?: string | null;
  chainId?: number;
  sourceChainId?: number | null;
  isActive?: boolean;
  registeredAt?: number;
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

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies?: Currency[];
  currenciesLoading?: boolean;
  onBalanceUpdate?: () => void;
}
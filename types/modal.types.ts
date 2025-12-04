export interface Currency {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies?: Currency[];
  currenciesLoading?: boolean;
  onBalanceUpdate?: () => void;
}
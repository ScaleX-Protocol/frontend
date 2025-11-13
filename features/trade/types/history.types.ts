export type OpenOrderStatus = 'pending' | 'partial' | 'completed' | 'cancelled';

export interface OpenOrder {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  filled: number;
  total: number;
  status: OpenOrderStatus;
  timestamp: string;
}

export interface TradeHistory {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  fee: number;
  timestamp: string;
}

export interface Balance {
  token: string;
  symbol: string;
  available: number;
  locked: number;
  total: number;
  usdValue: number;
}

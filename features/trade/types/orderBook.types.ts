export type OrderBookPrecision = 0.1 | 0.01 | 0.001;

export type OrderBookPattern = 'bid-ask' | 'bid-only' | 'ask-only';

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercentage: number;
}

export interface TradesData {
  id: string;
  price: number;
  total: number;
  time: number;
  side: 'buy' | 'sell';
}

export interface OrderBookParams {
  pair: string;
  precision?: OrderBookPrecision;
  pattern?: OrderBookPattern;
  limit?: number;
}

export interface TradesParams {
  pair: string;
  limit?: number;
}

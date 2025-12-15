// Chart types for service-trading
export interface Market {
  baseAsset: string;
  quoteAsset: string;
  symbol: string;
  volume: string;
  totalLiquidityInQuote: string;
}

export interface KlineData {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface TickerData {
  symbol: string;
  price: string;
  change: string;
  percentChange: string;
}
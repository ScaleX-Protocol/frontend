export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  numberOfTrades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
  ignored: string;
}

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  poolId: string;
  baseDecimals: number;
  quoteDecimals: number;
}

export interface Market extends TradingPair {
  volume: string;
  volumeInQuote: string;
  latestPrice: string;
  age: number;
  bidLiquidity: string;
  askLiquidity: string;
  totalLiquidityInQuote: string;
  createdAt: number;
}

export interface Ticker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: string;
  lastId: string;
  count: number;
}

export interface TickerPrice {
  symbol: string;
  price: string;
}

export const RESOLUTION_MAPPING: Record<string, string> = {
  '1': '1m',
  '5': '5m',
  '30': '30m',
  '60': '1h',
  '1D': '1d',
};

export interface DepthResponse {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
}

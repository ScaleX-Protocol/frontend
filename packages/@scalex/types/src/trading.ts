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
  asset: string;
  free: number;
  locked: number;
}

export interface OpenOrder {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  filled: number;
  total: number;
  status: 'pending' | 'partial' | 'completed';
  timestamp: string;
}

export interface Trade {
  id: string;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface Order {
  symbol: string;
  orderId: string;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cumulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface AccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: Balance[];
  permissions: string[];
}
export type ViewMode = 'both' | 'bids' | 'asks';

export type SpreadOption = 0.01 | 0.1 | 1 | 10 | 50 | 100;

export interface Trade {
  id: string;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface DepthResponse {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
}
export interface TradingToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isNative?: boolean;
}
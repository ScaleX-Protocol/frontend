/**
 * Types for combined REST API + WebSocket hooks
 * These hooks provide a unified interface for initial data loading and real-time updates
 */

// Common base interface for all realtime hook returns
export interface RealtimeHookState<T> {
  /** The current data (merged from REST and WebSocket updates) */
  data: T | null;
  /** Whether the initial REST request is loading */
  isLoading: boolean;
  /** Error from the REST request */
  error: Error | null;
  /** Whether WebSocket is connected and receiving updates */
  isConnected: boolean;
  /** Whether the current data includes real-time updates */
  isRealtime: boolean;
  /** Timestamp of the last update (REST or WebSocket) */
  lastUpdate: number | null;
  /** Manually refresh data from REST API */
  refresh: () => void;
}

// Order Book Types
export interface OrderBookLevel {
  price: string;
  quantity: string;
}

export interface OrderBookData {
  lastUpdateId: number;
  bids: Array<[string, string]>; // [price, quantity]
  asks: Array<[string, string]>; // [price, quantity]
  lastUpdate: number;
  isRealtime: boolean;
}

export interface UseOrderBookParams {
  symbol: string;
  limit?: number;
  enableRealtime?: boolean;
}

export interface UseOrderBookReturn extends RealtimeHookState<OrderBookData> {
  /** Best bid price */
  bestBid: string | null;
  /** Best ask price */
  bestAsk: string | null;
  /** Spread between best ask and best bid */
  spread: string | null;
}

// Trades Types
export interface TradeData {
  id: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: number;
  isRealtime: boolean;
}

export interface UseTradesParams {
  symbol: string;
  limit?: number;
  enableRealtime?: boolean;
}

export interface UseTradesReturn extends RealtimeHookState<TradeData[]> {
  /** Count of trades received via real-time updates */
  realtimeCount: number;
  /** The most recent trade */
  lastTrade: TradeData | null;
}

// Kline (Candlestick) Types
export type KlineInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

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
  isRealtime?: boolean;
}

export interface UseKlinesParams {
  symbol: string;
  interval: KlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
  enableRealtime?: boolean;
}

export interface UseKlinesReturn extends RealtimeHookState<KlineData[]> {
  /** The current (latest) kline */
  currentKline: KlineData | null;
}

// Ticker Types
export interface TickerData {
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
  lastUpdate: number;
  isRealtime: boolean;
}

export interface UseTickerParams {
  symbol: string;
  enableRealtime?: boolean;
}

export interface UseTickerReturn extends RealtimeHookState<TickerData> {
  /** Current price from ticker */
  price: string | null;
  /** 24h price change percentage */
  priceChangePercent: string | null;
}

// User Orders Types
export interface OrderData {
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
  isRealtime?: boolean;
}

export interface UseUserOrdersParams {
  address: string;
  symbol?: string;
  limit?: number;
  enableRealtime?: boolean;
}

export interface UseUserOrdersReturn extends RealtimeHookState<OrderData[]> {
  /** Number of open orders */
  openOrderCount: number;
  /** Count of orders updated in real-time */
  realtimeCount: number;
}

// Order History Types
export interface UseOrderHistoryParams {
  address: string;
  symbol?: string;
  limit?: number;
  enableRealtime?: boolean;
}

export interface UseOrderHistoryReturn extends RealtimeHookState<OrderData[]> {
  /** Total number of orders in history */
  totalOrders: number;
  /** Count of orders updated in real-time */
  realtimeCount: number;
}

// Account Types
export interface BalanceData {
  asset: string;
  free: number;
  locked: number;
  isRealtime?: boolean;
}

export interface AccountData {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: BalanceData[];
  permissions: string[];
  lastUpdate: number;
  isRealtime: boolean;
}

export interface UseAccountParams {
  address: string;
  enableRealtime?: boolean;
}

export interface UseAccountReturn extends RealtimeHookState<AccountData> {
  /** Get balance for a specific asset */
  getBalance: (asset: string) => BalanceData | null;
  /** Total number of assets with non-zero balance */
  assetCount: number;
}

// WebSocket Update Message Types (from server)
export interface OrderUpdateMessage {
  type: 'order_update';
  data: {
    orderId: string;
    symbol: string;
    status: string;
    executedQty: string;
    cumulativeQuoteQty: string;
    updateTime: number;
  };
}

export interface BalanceUpdateMessage {
  type: 'balance_update';
  data: {
    asset: string;
    free: number;
    locked: number;
  };
}

export interface KlineUpdateMessage {
  type: 'kline';
  symbol: string;
  interval: string;
  data: {
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
    isFinal: boolean;
  };
}

export interface MiniTickerMessage {
  type: 'miniTicker';
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  volume: string;
  timestamp: number;
}

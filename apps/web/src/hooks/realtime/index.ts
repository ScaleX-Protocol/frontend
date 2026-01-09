/**
 * Real-time Data Hooks
 *
 * Custom React hooks that combine REST API fetching with WebSocket subscriptions,
 * providing a single interface for initial data loading and real-time updates.
 *
 * ## Market Data Hooks
 *
 * | Hook          | REST Endpoint     | WebSocket Stream          |
 * |---------------|-------------------|---------------------------|
 * | useOrderBook  | /api/depth        | {symbol}@depth            |
 * | useTrades     | /api/trades       | {symbol}@trade            |
 * | useKlines     | /api/kline        | {symbol}@kline_{interval} |
 * | useTicker     | /api/ticker/24hr  | {symbol}@miniTicker       |
 *
 * ## User Data Hooks
 *
 * | Hook            | REST Endpoint     | WebSocket Events   |
 * |-----------------|-------------------|--------------------|
 * | useUserOrders   | /api/openOrders   | order updates      |
 * | useOrderHistory | /api/allOrders    | order updates      |
 * | useAccount      | /api/account      | balance updates    |
 *
 * ## Usage Example
 *
 * ```tsx
 * import { useOrderBook, useTrades, useTicker } from '@/hooks/realtime';
 *
 * function TradingPanel({ symbol }: { symbol: string }) {
 *   const { data: orderBook, bestBid, bestAsk, isConnected } = useOrderBook({
 *     symbol,
 *     limit: 50,
 *     enableRealtime: true
 *   });
 *
 *   const { data: trades, lastTrade } = useTrades({
 *     symbol,
 *     limit: 100
 *   });
 *
 *   const { price, priceChangePercent } = useTicker({ symbol });
 *
 *   return (
 *     <div>
 *       <p>Price: {price} ({priceChangePercent}%)</p>
 *       <p>Spread: {bestAsk} - {bestBid}</p>
 *       <p>Last trade: {lastTrade?.price}</p>
 *       <p>Connection: {isConnected ? 'Live' : 'Offline'}</p>
 *     </div>
 *   );
 * }
 * ```
 */

// Market Data Hooks
export { useOrderBook } from './useOrderBook';
export { useTrades } from './useTrades';
export { useKlines } from './useKlines';
export { useTicker } from './useTicker';

// User Data Hooks
export { useUserOrders } from './useUserOrders';
export { useOrderHistory } from './useOrderHistory';
export { useAccount } from './useAccount';

// Types
export type {
  // Common types
  RealtimeHookState,

  // Order book types
  OrderBookLevel,
  OrderBookData,
  UseOrderBookParams,
  UseOrderBookReturn,

  // Trades types
  TradeData,
  UseTradesParams,
  UseTradesReturn,

  // Kline types
  KlineInterval,
  KlineData,
  UseKlinesParams,
  UseKlinesReturn,

  // Ticker types
  TickerData,
  UseTickerParams,
  UseTickerReturn,

  // Order types
  OrderData,
  UseUserOrdersParams,
  UseUserOrdersReturn,
  UseOrderHistoryParams,
  UseOrderHistoryReturn,

  // Account types
  BalanceData,
  AccountData,
  UseAccountParams,
  UseAccountReturn,

  // WebSocket message types
  OrderUpdateMessage,
  BalanceUpdateMessage,
  KlineUpdateMessage,
  MiniTickerMessage,
} from './types';

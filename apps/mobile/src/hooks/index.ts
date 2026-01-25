/**
 * WebSocket Hooks Index
 * Export all WebSocket-related hooks
 */

export { useOrderBookWebSocket } from './use-order-book-websocket';
export { useTradesWebSocket } from './use-trades-websocket';
export type {
  OrderBookData,
  UseOrderBookWebSocketParams,
  UseOrderBookWebSocketReturn,
} from './use-order-book-websocket';
export type {
  TradeWithTimestamp,
  UseTradesWebSocketParams,
  UseTradesWebSocketReturn,
} from './use-trades-websocket';

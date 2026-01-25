/**
 * Mobile-compatible wrapper for useDepthWithRealtime
 * Uses the mobile WebSocket implementation
 */

import { useOrderBookWebSocket } from '../../hooks/use-order-book-websocket';
import { ENDPOINTS } from '../../config/api';

export interface UseDepthWithRealtimeParams {
  symbol: string;
  limit?: number;
  enableRealtime?: boolean;
}

export function useDepthWithRealtime(params: UseDepthWithRealtimeParams) {
  const { symbol, limit = 100, enableRealtime = true } = params;

  const {
    bids,
    asks,
    isConnected,
    isLoading,
    error,
    refresh
  } = useOrderBookWebSocket({
    symbol,
    limit,
    enabled: enableRealtime,
    websocketUrl: ENDPOINTS.websocket,
  });

  return {
    data: bids.length > 0 || asks.length > 0 ? { bids, asks } : null,
    isLoading,
    error,
    refresh,
    isConnected,
    isRealtime: isConnected,
    lastUpdate: Date.now(),
  };
}

/**
 * Mobile-compatible wrapper for useTradesWithRealtime
 * Uses the mobile WebSocket implementation
 */

import { ENDPOINTS } from "~/src/config/api";
import { useTradesWebSocket } from "../../use-trades-websocket";



export interface UseTradesWithRealtimeParams {
  symbol: string;
  limit?: number;
  enableRealtime?: boolean;
}

export function useTradesWithRealtime(params: UseTradesWithRealtimeParams) {
  const { symbol, limit = 100, enableRealtime = true } = params;

  const {
    trades,
    isConnected,
    isLoading,
    error,
    refresh,
    realtimeCount
  } = useTradesWebSocket({
    symbol,
    limit,
    enabled: enableRealtime,
    websocketUrl: ENDPOINTS.websocket,
  });

  return {
    data: trades,
    isLoading,
    error,
    refresh,
    isConnected,
    realtimeCount,
    lastTrade: trades[0] || null,
  };
}

/**
 * Trades WebSocket Hook
 * Subscribes to recent trades updates with throttling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Trade } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../lib/api/client';
import { getWebSocketClient, type ConnectionState } from '../lib/websocket';
import { formatSymbolForAPI } from '../lib/format';

export interface TradeWithTimestamp extends Trade {
  receivedAt: number;
  isRealtime: boolean;
}

export interface UseTradesWebSocketParams {
  symbol: string;
  limit?: number;
  enabled?: boolean;
  websocketUrl?: string;
}

export interface UseTradesWebSocketReturn {
  trades: TradeWithTimestamp[];
  connectionStatus: ConnectionState;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  realtimeCount: number;
}

/**
 * Custom throttle function implementation
 */
function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Hook for subscribing to trades updates via WebSocket
 */
export function useTradesWebSocket(
  params: UseTradesWebSocketParams
): UseTradesWebSocketReturn {
  const { symbol, limit = 100, enabled = true, websocketUrl } = params;

  const [trades, setTrades] = useState<TradeWithTimestamp[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usePolling, setUsePolling] = useState(false);

  // Use refs to avoid closure issues
  const wsClientRef = useRef<ReturnType<typeof getWebSocketClient> | null>(null);
  const tradesRef = useRef<TradeWithTimestamp[]>([]);
  const updateThrottledRef = useRef<((update: TradeWithTimestamp) => void) | null>(null);

  // Update refs when state changes
  useEffect(() => {
    tradesRef.current = trades;
  }, [trades]);

  /**
   * Fetch initial trades data via REST API
   */
  const fetchTrades = useCallback(async () => {
    if (!symbol) return;

    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      searchParams.set('symbol', formatSymbolForAPI(symbol));
      searchParams.set('limit', String(limit));

      const data = await fetchIndexerAPIMobile<Trade[]>(`/trades?${searchParams.toString()}`, undefined, {
        ttl: 10000, // 10s cache for fallback data
        staleWhileRevalidate: true,
        offlineFirst: false,
      });

      const tradesWithTimestamp: TradeWithTimestamp[] = data.map(trade => ({
        ...trade,
        receivedAt: Date.now(),
        isRealtime: false,
      }));

      setTrades(tradesWithTimestamp);
      setIsLoading(false);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch trades');
      setError(errorObj);
      setIsLoading(false);

      // If WebSocket fails, fallback to polling
      if (usePolling) {
        console.log('[Trades WS] Using polling fallback');
      }
    }
  }, [symbol, limit, usePolling]);

  /**
   * Throttled update function
   */
  useEffect(() => {
    updateThrottledRef.current = throttle((newTrade: unknown) => {
      const trade = newTrade as TradeWithTimestamp;
      setTrades(prev => {
        // Add new trade to the beginning and limit the array size
        const updated = [trade, ...prev].slice(0, limit);
        return updated;
      });
    }, 500); // Throttle to 500ms
  }, [limit]);

  /**
   * Setup WebSocket connection
   */
  useEffect(() => {
    if (!enabled || !symbol || usePolling) {
      return;
    }

    // Get WebSocket URL from config or use default
    const wsUrl = websocketUrl || '';

    if (!wsUrl) {
      console.warn('[Trades WS] No WebSocket URL provided, using polling');
      setUsePolling(true);
      return;
    }

    try {
      // Initialize WebSocket client
      wsClientRef.current = getWebSocketClient({
        url: wsUrl,
        maxRetries: 3,
        retryDelay: 1000,
        heartbeatInterval: 30000,
      });

      // Subscribe to connection state changes
      const unsubscribeConnection = wsClientRef.current.onConnectionChange((state) => {
        setConnectionStatus(state);

        // Fallback to polling on error
        if (state === 'error') {
          console.log('[Trades WS] Connection error, falling back to polling');
          setUsePolling(true);
        }
      });

      // Subscribe to trades channel
      const formattedSymbol = formatSymbolForAPI(symbol);
      const channel = `trades@${formattedSymbol}`;
      wsClientRef.current.subscribe(channel);

      // Subscribe to trade updates
      const unsubscribeMessage = wsClientRef.current.on(channel, (message) => {
        if (message.type === 'trade' || message.type === 'tradeUpdate') {
          const tradeData = message.data as Trade;

          const newTrade: TradeWithTimestamp = {
            ...tradeData,
            receivedAt: message.timestamp || Date.now(),
            isRealtime: true,
          };

          if (updateThrottledRef.current) {
            updateThrottledRef.current(newTrade);
          }
        }
      });

      // Connect to WebSocket
      wsClientRef.current.connect();

      // Cleanup
      return () => {
        unsubscribeConnection();
        unsubscribeMessage();
        wsClientRef.current?.unsubscribe(channel);
      };
    } catch (err) {
      console.error('[Trades WS] Initialization error:', err);
      setUsePolling(true);
    }
  }, [enabled, symbol, websocketUrl, usePolling]);

  /**
   * Fetch initial data on mount
   */
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  /**
   * Setup polling fallback
   */
  useEffect(() => {
    if (!usePolling || !enabled) return;

    const interval = setInterval(() => {
      fetchTrades();
    }, 2000); // Poll every 2s

    return () => clearInterval(interval);
  }, [usePolling, enabled, fetchTrades]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchTrades();
  }, [fetchTrades]);

  const realtimeCount = trades.filter(t => t.isRealtime).length;

  return {
    trades,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isLoading,
    error,
    refresh,
    realtimeCount,
  };
}

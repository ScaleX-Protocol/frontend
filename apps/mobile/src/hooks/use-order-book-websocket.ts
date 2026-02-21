/**
 * Order Book WebSocket Hook
 * Subscribes to order book depth updates with throttling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DepthResponse } from '@scalex/types';
import { fetchIndexerAPIMobile } from '../lib/api/client';
import { getWebSocketClient, type ConnectionState } from '../lib/websocket';
import { formatSymbolForAPI } from '../lib/format';

export interface OrderBookData {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId: number;
}

export interface UseOrderBookWebSocketParams {
  symbol: string;
  limit?: number;
  enabled?: boolean;
  websocketUrl?: string;
}

export interface UseOrderBookWebSocketReturn {
  bids: [string, string][];
  asks: [string, string][];
  connectionStatus: ConnectionState;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
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
 * Merge depth updates into existing data
 */
function mergeDepthLevels(
  existingLevels: Array<[string, string]>,
  updateLevels: Array<[string, string]>,
  type: 'bid' | 'ask'
): Array<[string, string]> {
  // Create a map for efficient lookup
  const levelMap = new Map<string, string>(
    existingLevels.map(([price, quantity]) => [price, quantity])
  );

  // Apply updates
  updateLevels.forEach(([price, quantity]) => {
    if (parseFloat(quantity) === 0) {
      // Remove level if quantity is 0
      levelMap.delete(price);
    } else {
      // Update or add level
      levelMap.set(price, quantity);
    }
  });

  // Convert back to array and sort
  const sortedLevels = Array.from(levelMap.entries())
    .map(([price, quantity]) => [price, quantity] as [string, string])
    .sort((a, b) => {
      const priceA = parseFloat(a[0]);
      const priceB = parseFloat(b[0]);

      if (type === 'bid') {
        // Sort bids in descending order (highest first)
        return priceB - priceA;
      } else {
        // Sort asks in ascending order (lowest first)
        return priceA - priceB;
      }
    });

  return sortedLevels;
}

/**
 * Hook for subscribing to order book updates via WebSocket
 */
export function useOrderBookWebSocket(
  params: UseOrderBookWebSocketParams
): UseOrderBookWebSocketReturn {
  const { symbol, limit = 100, enabled = true, websocketUrl } = params;

  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usePolling, setUsePolling] = useState(false);

  // Use refs to avoid closure issues
  const wsClientRef = useRef<ReturnType<typeof getWebSocketClient> | null>(null);
  const dataRef = useRef({ bids, asks });
  const updateThrottledRef = useRef<((update: DepthResponse) => void) | null>(null);

  // Update refs when state changes
  useEffect(() => {
    dataRef.current = { bids, asks };
  }, [bids, asks]);

  /**
   * Fetch initial order book data via REST API
   */
  const fetchOrderBook = useCallback(async () => {
    if (!symbol) return;

    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      searchParams.set('symbol', formatSymbolForAPI(symbol));
      searchParams.set('limit', String(limit));

      const data = await fetchIndexerAPIMobile<DepthResponse>(`/depth?${searchParams.toString()}`, undefined, {
        ttl: 10000, // 10s cache for fallback data
        staleWhileRevalidate: true,
        offlineFirst: false,
      });

      setBids(data.bids);
      setAsks(data.asks);
      setIsLoading(false);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch order book');
      setError(errorObj);
      setIsLoading(false);

      // If WebSocket fails, fallback to polling
      if (usePolling) {
        console.log('[OrderBook WS] Using polling fallback');
      }
    }
  }, [symbol, limit, usePolling]);

  /**
   * Throttled update function
   */
  useEffect(() => {
    updateThrottledRef.current = throttle((update: unknown) => {
      const depthUpdate = update as DepthResponse;
      const currentData = dataRef.current;

      const updatedBids = mergeDepthLevels(currentData.bids, depthUpdate.bids, 'bid');
      const updatedAsks = mergeDepthLevels(currentData.asks, depthUpdate.asks, 'ask');

      setBids(updatedBids);
      setAsks(updatedAsks);
    }, 500); // Throttle to 500ms
  }, []);

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
      console.warn('[OrderBook WS] No WebSocket URL provided, using polling');
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
          console.log('[OrderBook WS] Connection error, falling back to polling');
          setUsePolling(true);
        }
      });

      // Subscribe to depth channel
      const formattedSymbol = formatSymbolForAPI(symbol);
      const channel = `depth@${formattedSymbol}`;
      wsClientRef.current.subscribe(channel);

      // Subscribe to depth updates
      const unsubscribeMessage = wsClientRef.current.on(channel, (message) => {
        if (message.type === 'depth' || message.type === 'depthUpdate') {
          const update = message.data as DepthResponse;

          if (updateThrottledRef.current) {
            updateThrottledRef.current(update);
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
      console.error('[OrderBook WS] Initialization error:', err);
      setUsePolling(true);
    }
  }, [enabled, symbol, websocketUrl, usePolling]);

  /**
   * Fetch initial data on mount
   */
  useEffect(() => {
    fetchOrderBook();
  }, [fetchOrderBook]);

  /**
   * Setup polling fallback
   */
  useEffect(() => {
    if (!usePolling || !enabled) return;

    const interval = setInterval(() => {
      fetchOrderBook();
    }, 1500); // Poll every 1.5s

    return () => clearInterval(interval);
  }, [usePolling, enabled, fetchOrderBook]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchOrderBook();
  }, [fetchOrderBook]);

  return {
    bids,
    asks,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isLoading,
    error,
    refresh,
  };
}

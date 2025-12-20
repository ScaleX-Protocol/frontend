import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import { useWebSocketSubscriptions, type DepthUpdate } from '@/hooks/useWebSocketSubscriptions';
import type { OrderBookData, UseOrderBookParams, UseOrderBookReturn } from './types';
import { logger } from '@/utils/logger';

interface DepthResponse {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

/**
 * Hook that combines REST API fetching with WebSocket subscriptions for order book data.
 * Provides initial data loading from /api/depth and real-time updates via {symbol}@depth stream.
 *
 * @param params - Configuration parameters
 * @param params.symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @param params.limit - Number of price levels to fetch (default: 100)
 * @param params.enableRealtime - Whether to enable WebSocket updates (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading, bestBid, bestAsk, spread, isConnected } = useOrderBook({
 *   symbol: 'BTCUSDT',
 *   limit: 50,
 *   enableRealtime: true
 * });
 * ```
 */
export function useOrderBook(params: UseOrderBookParams): UseOrderBookReturn {
  const { symbol, limit = 100, enableRealtime = true } = params;
  const [mergedData, setMergedData] = useState<OrderBookData | null>(null);
  const { subscribeToDepth, isConnected } = useWebSocketSubscriptions();

  // Initial depth data fetch via REST API
  const {
    data: initialData,
    isLoading,
    error,
    refetch
  } = useQuery<DepthResponse, Error>({
    queryKey: ['orderBook', symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));
      const query = searchParams.toString();
      return fetchIndexerAPI<DepthResponse>(`/depth?${query}`);
    },
    enabled: !!symbol,
    refetchInterval: enableRealtime ? false : 1500,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
  });

  // Set initial data from REST response
  useEffect(() => {
    if (initialData && !mergedData) {
      setMergedData({
        ...initialData,
        lastUpdate: Date.now(),
        isRealtime: false
      });
    }
  }, [initialData, mergedData]);

  // Reset merged data when symbol changes
  useEffect(() => {
    setMergedData(null);
  }, [symbol]);

  // WebSocket subscription for real-time depth updates
  useEffect(() => {
    if (!symbol || !enableRealtime || !isConnected) {
      return;
    }

    logger.info(`[OrderBook] Setting up real-time updates for ${symbol}`);

    const unsubscribe = subscribeToDepth(symbol, (update: DepthUpdate) => {
      setMergedData(prev => {
        if (!prev) return null;

        // Merge the real-time update with existing data
        const updatedBids = mergeDepthLevels(prev.bids, update.bids, 'bid');
        const updatedAsks = mergeDepthLevels(prev.asks, update.asks, 'ask');

        logger.debug(`[OrderBook] Update received for ${symbol}`, {
          bidCount: updatedBids.length,
          askCount: updatedAsks.length,
          timestamp: update.timestamp
        });

        return {
          ...prev,
          bids: updatedBids,
          asks: updatedAsks,
          lastUpdate: update.timestamp || Date.now(),
          isRealtime: true
        };
      });
    });

    return () => {
      logger.info(`[OrderBook] Cleaning up real-time updates for ${symbol}`);
      unsubscribe();
    };
  }, [symbol, enableRealtime, isConnected, subscribeToDepth]);

  // Calculate derived values
  const bestBid = useMemo(() => {
    if (!mergedData?.bids?.length) return null;
    return mergedData.bids[0][0];
  }, [mergedData]);

  const bestAsk = useMemo(() => {
    if (!mergedData?.asks?.length) return null;
    return mergedData.asks[0][0];
  }, [mergedData]);

  const spread = useMemo(() => {
    if (!bestBid || !bestAsk) return null;
    const spreadValue = parseFloat(bestAsk) - parseFloat(bestBid);
    return spreadValue.toFixed(8);
  }, [bestBid, bestAsk]);

  const refresh = useCallback(() => {
    setMergedData(null);
    refetch();
  }, [refetch]);

  return {
    data: mergedData,
    isLoading,
    error,
    refresh,
    isConnected: isConnected && enableRealtime,
    isRealtime: mergedData?.isRealtime || false,
    lastUpdate: mergedData?.lastUpdate || null,
    bestBid,
    bestAsk,
    spread
  };
}

/**
 * Merges existing depth levels with incoming updates.
 * Removes levels with zero quantity and maintains proper sort order.
 */
function mergeDepthLevels(
  existingLevels: Array<[string, string]>,
  updateLevels: Array<[string, string]>,
  type: 'bid' | 'ask'
): Array<[string, string]> {
  const levelMap = new Map<string, string>(
    existingLevels.map(([price, quantity]) => [price, quantity])
  );

  // Apply updates
  updateLevels.forEach(([price, quantity]) => {
    if (parseFloat(quantity) === 0) {
      levelMap.delete(price);
    } else {
      levelMap.set(price, quantity);
    }
  });

  // Convert back to array and sort
  return Array.from(levelMap.entries())
    .map(([price, quantity]) => [price, quantity] as [string, string])
    .sort((a, b) => {
      const priceA = parseFloat(a[0]);
      const priceB = parseFloat(b[0]);
      // Bids: descending (highest first), Asks: ascending (lowest first)
      return type === 'bid' ? priceB - priceA : priceA - priceB;
    });
}

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { DepthUpdate } from '@/hooks/useWebSocketSubscriptions';
import { useWebSocketSubscriptions } from '@/hooks/useWebSocketSubscriptions';
import { LogLabel, LogLevel, logger, ServiceName } from '@/utils/logger';
import type { DepthResponse } from '../../types/orderBook.types';

export interface UseDepthWithRealtimeParams {
  symbol: string;
  limit?: number;
  enableRealtime?: boolean;
}

interface MergedDepthData extends DepthResponse {
  lastUpdate: number;
  isRealtime: boolean;
}

export function useDepthWithRealtime(params: UseDepthWithRealtimeParams) {
  const { symbol, limit = 100, enableRealtime = true } = params;
  const [mergedData, setMergedData] = useState<MergedDepthData | null>(null);
  const { subscribeToDepth, isConnected } = useWebSocketSubscriptions();

  // Initial depth data fetch
  const {
    data: initialData,
    isLoading,
    error,
    refetch,
  } = useQuery<DepthResponse, Error>({
    queryKey: ['depth', symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchAPI<DepthResponse>(`/depth?${query}`);
    },
    enabled: !!symbol,
    refetchInterval: enableRealtime ? false : 1500, // Only refetch if realtime is disabled
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
  });

  // Set initial data
  useEffect(() => {
    if (initialData && !mergedData) {
      setMergedData({
        ...initialData,
        lastUpdate: Date.now(),
        isRealtime: false,
      });
    }
  }, [initialData, mergedData]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!symbol || !enableRealtime || !isConnected) {
      return;
    }

    logger.log(
      LogLevel.INFO,
      LogLabel.WEBSOCKET,
      ServiceName.ORDER_BOOK,
      `Setting up real-time depth updates for ${symbol}`,
    );

    const unsubscribe = subscribeToDepth(symbol, (update: DepthUpdate) => {
      setMergedData((prev) => {
        if (!prev) return null;

        // Merge the real-time update with existing data
        const updatedBids = mergeDepthLevels(prev.bids, update.bids, 'bid');
        const updatedAsks = mergeDepthLevels(prev.asks, update.asks, 'ask');

        const mergedDepth: MergedDepthData = {
          ...prev,
          bids: updatedBids,
          asks: updatedAsks,
          lastUpdate: update.timestamp || Date.now(),
          isRealtime: true,
        };

        // Log the depth update
        logger.log(LogLevel.DEBUG, LogLabel.WEBSOCKET, ServiceName.ORDER_BOOK, `Depth update received for ${symbol}`, {
          bidCount: updatedBids.length,
          askCount: updatedAsks.length,
          timestamp: update.timestamp,
        });

        return mergedDepth;
      });
    });

    return () => {
      logger.log(
        LogLevel.INFO,
        LogLabel.WEBSOCKET,
        ServiceName.ORDER_BOOK,
        `Cleaning up real-time depth updates for ${symbol}`,
      );
      unsubscribe();
    };
  }, [symbol, enableRealtime, isConnected, subscribeToDepth]);

  // Function to manually refresh data
  const refresh = useCallback(() => {
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
  };
}

// Helper function to merge depth levels
function mergeDepthLevels(
  existingLevels: Array<[string, string]>,
  updateLevels: Array<[string, string]>,
  type: 'bid' | 'ask',
): Array<[string, string]> {
  // Create a map for efficient lookup
  const levelMap = new Map<string, string>(existingLevels.map(([price, quantity]) => [price, quantity]));

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

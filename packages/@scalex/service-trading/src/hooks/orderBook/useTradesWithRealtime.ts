import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@scalex/api-client';
import { useWebSocketSubscriptions } from '@/hooks/useWebSocketSubscriptions';
import type { Trade } from '@scalex/types';
import type { TradeUpdate } from '@/hooks/useWebSocketSubscriptions';
import { logger, LogLevel, LogLabel, ServiceName } from '@/utils/logger';

export interface UseTradesWithRealtimeParams {
  symbol: string;
  limit?: number;
  enableRealtime?: boolean;
}

interface TradeWithTimestamp extends Trade {
  timestamp: number;
  isRealtime: boolean;
}

export function useTradesWithRealtime(
  params: UseTradesWithRealtimeParams
) {
  const { symbol, limit = 100, enableRealtime = true } = params;
  const [trades, setTrades] = useState<TradeWithTimestamp[]>([]);
  const { subscribeToTrades, isConnected } = useWebSocketSubscriptions();

  // Initial trades data fetch
  const {
    data: initialData,
    isLoading,
    error,
    refetch
  } = useQuery<Trade[], Error>({
    queryKey: ['trades', symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));

      const query = searchParams.toString();

      return fetchIndexerAPI<Trade[]>(`/trades?${query}`);
    },
    enabled: !!symbol,
    refetchInterval: enableRealtime ? false : 2000, // Only refetch if realtime is disabled
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
  });

  // Set initial trades
  useEffect(() => {
    if (initialData && trades.length === 0) {
      const tradesWithTimestamp: TradeWithTimestamp[] = initialData.map(trade => ({
        ...trade,
        timestamp: Date.now(),
        isRealtime: false
      }));
      setTrades(tradesWithTimestamp);
    }
  }, [initialData, trades.length]);

  // WebSocket subscription for real-time trades
  useEffect(() => {
    if (!symbol || !enableRealtime || !isConnected) {
      return;
    }

    logger.log(
      LogLevel.INFO,
      LogLabel.WEBSOCKET,
      ServiceName.TRADES,
      `Setting up real-time trades updates for ${symbol}`
    );

    const unsubscribe = subscribeToTrades(symbol, (update: TradeUpdate) => {
      setTrades(prev => {
        // Create new trade from update
        const newTrade: TradeWithTimestamp = {
          id: `${update.timestamp}_${update.price}_${update.quantity}`,
          price: update.price,
          quantity: update.quantity,
          side: update.side,
          timestamp: update.timestamp || Date.now(),
          isRealtime: true
        };

        // Add new trade to the beginning and limit the array size
        const updatedTrades = [newTrade, ...prev].slice(0, limit);

        // Log the trade update
        logger.log(
          LogLevel.DEBUG,
          LogLabel.WEBSOCKET,
          ServiceName.TRADES,
          `New trade received for ${symbol}`,
          {
            price: update.price,
            quantity: update.quantity,
            side: update.side,
            totalTrades: updatedTrades.length
          }
        );

        return updatedTrades;
      });
    });

    return () => {
      logger.log(
        LogLevel.INFO,
        LogLabel.WEBSOCKET,
        ServiceName.TRADES,
        `Cleaning up real-time trades updates for ${symbol}`
      );
      unsubscribe();
    };
  }, [symbol, limit, enableRealtime, isConnected, subscribeToTrades]);

  // Function to manually refresh data
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data: trades,
    isLoading,
    error,
    refresh,
    isConnected: isConnected && enableRealtime,
    realtimeCount: trades.filter(t => t.isRealtime).length,
    lastTrade: trades[0] || null
  };
}
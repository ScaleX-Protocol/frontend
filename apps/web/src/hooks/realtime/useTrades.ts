import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import { useWebSocketSubscriptions, type TradeUpdate } from '@/hooks/useWebSocketSubscriptions';
import type { TradeData, UseTradesParams, UseTradesReturn } from './types';
import { logger } from '@/utils/logger';

interface TradeResponse {
  id: string;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

/**
 * Hook that combines REST API fetching with WebSocket subscriptions for trades data.
 * Provides initial data loading from /api/trades and real-time updates via {symbol}@trade stream.
 *
 * @param params - Configuration parameters
 * @param params.symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @param params.limit - Maximum number of trades to maintain (default: 100)
 * @param params.enableRealtime - Whether to enable WebSocket updates (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading, lastTrade, realtimeCount, isConnected } = useTrades({
 *   symbol: 'BTCUSDT',
 *   limit: 50,
 *   enableRealtime: true
 * });
 * ```
 */
export function useTrades(params: UseTradesParams): UseTradesReturn {
  const { symbol, limit = 100, enableRealtime = true } = params;
  const [trades, setTrades] = useState<TradeData[]>([]);
  const { subscribeToTrades, isConnected } = useWebSocketSubscriptions();

  // Initial trades data fetch via REST API
  const {
    data: initialData,
    isLoading,
    error,
    refetch
  } = useQuery<TradeResponse[], Error>({
    queryKey: ['trades', symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));
      const query = searchParams.toString();
      return fetchIndexerAPI<TradeResponse[]>(`/trades?${query}`);
    },
    enabled: !!symbol,
    refetchInterval: enableRealtime ? false : 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
  });

  // Set initial trades from REST response
  useEffect(() => {
    if (initialData && trades.length === 0) {
      const normalizedTrades: TradeData[] = initialData.map(trade => ({
        id: trade.id,
        price: trade.price,
        quantity: trade.qty,
        side: trade.isBuyerMaker ? 'sell' : 'buy',
        timestamp: trade.time,
        isRealtime: false
      }));
      setTrades(normalizedTrades);
    }
  }, [initialData, trades.length]);

  // Reset trades when symbol changes
  useEffect(() => {
    setTrades([]);
  }, [symbol]);

  // WebSocket subscription for real-time trade updates
  useEffect(() => {
    if (!symbol || !enableRealtime || !isConnected) {
      return;
    }

    logger.info(`[Trades] Setting up real-time updates for ${symbol}`);

    const unsubscribe = subscribeToTrades(symbol, (update: TradeUpdate) => {
      setTrades(prev => {
        const newTrade: TradeData = {
          id: `${update.timestamp}_${update.price}_${update.quantity}`,
          price: update.price,
          quantity: update.quantity,
          side: update.side,
          timestamp: update.timestamp || Date.now(),
          isRealtime: true
        };

        // Add new trade to the beginning and limit array size
        const updatedTrades = [newTrade, ...prev].slice(0, limit);

        logger.debug(`[Trades] New trade received for ${symbol}`, {
          price: update.price,
          quantity: update.quantity,
          side: update.side,
          totalTrades: updatedTrades.length
        });

        return updatedTrades;
      });
    });

    return () => {
      logger.info(`[Trades] Cleaning up real-time updates for ${symbol}`);
      unsubscribe();
    };
  }, [symbol, limit, enableRealtime, isConnected, subscribeToTrades]);

  // Calculate derived values
  const realtimeCount = useMemo(() => {
    return trades.filter(t => t.isRealtime).length;
  }, [trades]);

  const lastTrade = useMemo(() => {
    return trades[0] || null;
  }, [trades]);

  const lastUpdate = useMemo(() => {
    return trades[0]?.timestamp || null;
  }, [trades]);

  const isRealtime = useMemo(() => {
    return trades.some(t => t.isRealtime);
  }, [trades]);

  const refresh = useCallback(() => {
    setTrades([]);
    refetch();
  }, [refetch]);

  return {
    data: trades.length > 0 ? trades : null,
    isLoading,
    error,
    refresh,
    isConnected: isConnected && enableRealtime,
    isRealtime,
    lastUpdate,
    realtimeCount,
    lastTrade
  };
}

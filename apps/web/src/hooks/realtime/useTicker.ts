import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import { useWebSocketSubscriptions, type TickerUpdate } from '@/hooks/useWebSocketSubscriptions';
import type { TickerData, UseTickerParams, UseTickerReturn } from './types';
import { logger } from '@/utils/logger';

interface Ticker24hrResponse {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: string;
  lastId: string;
  count: number;
}

/**
 * Hook that combines REST API fetching with WebSocket subscriptions for ticker data.
 * Provides initial data loading from /api/ticker/24hr and real-time updates via {symbol}@miniTicker stream.
 *
 * @param params - Configuration parameters
 * @param params.symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @param params.enableRealtime - Whether to enable WebSocket updates (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading, price, priceChangePercent, isConnected } = useTicker({
 *   symbol: 'BTCUSDT',
 *   enableRealtime: true
 * });
 * ```
 */
export function useTicker(params: UseTickerParams): UseTickerReturn {
  const { symbol, enableRealtime = true } = params;
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const { subscribeToTicker, isConnected } = useWebSocketSubscriptions();

  // Initial ticker data fetch via REST API
  const {
    data: initialData,
    isLoading,
    error,
    refetch
  } = useQuery<Ticker24hrResponse, Error>({
    queryKey: ['ticker', symbol] as const,
    queryFn: () => fetchIndexerAPI<Ticker24hrResponse>(`/ticker/24hr?symbol=${symbol}`),
    enabled: !!symbol,
    refetchInterval: enableRealtime ? false : 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
  });

  // Set initial ticker data from REST response
  useEffect(() => {
    if (initialData && !tickerData) {
      setTickerData({
        ...initialData,
        lastUpdate: Date.now(),
        isRealtime: false
      });
    }
  }, [initialData, tickerData]);

  // Reset ticker data when symbol changes
  useEffect(() => {
    setTickerData(null);
  }, [symbol]);

  // WebSocket subscription for real-time ticker updates
  useEffect(() => {
    if (!symbol || !enableRealtime || !isConnected) {
      return;
    }

    logger.info(`[Ticker] Setting up real-time updates for ${symbol}`);

    const unsubscribe = subscribeToTicker(symbol, (update: TickerUpdate) => {
      setTickerData(prev => {
        if (!prev) return null;

        // Merge the real-time update with existing data
        const updated: TickerData = {
          ...prev,
          lastPrice: update.price,
          priceChange: update.priceChange,
          priceChangePercent: update.priceChangePercent,
          volume: update.volume,
          lastUpdate: update.timestamp || Date.now(),
          isRealtime: true
        };

        logger.debug(`[Ticker] Update received for ${symbol}`, {
          price: update.price,
          priceChangePercent: update.priceChangePercent
        });

        return updated;
      });
    });

    return () => {
      logger.info(`[Ticker] Cleaning up real-time updates for ${symbol}`);
      unsubscribe();
    };
  }, [symbol, enableRealtime, isConnected, subscribeToTicker]);

  // Calculate derived values
  const price = useMemo(() => {
    return tickerData?.lastPrice || null;
  }, [tickerData]);

  const priceChangePercent = useMemo(() => {
    return tickerData?.priceChangePercent || null;
  }, [tickerData]);

  const refresh = useCallback(() => {
    setTickerData(null);
    refetch();
  }, [refetch]);

  return {
    data: tickerData,
    isLoading,
    error,
    refresh,
    isConnected: isConnected && enableRealtime,
    isRealtime: tickerData?.isRealtime || false,
    lastUpdate: tickerData?.lastUpdate || null,
    price,
    priceChangePercent
  };
}

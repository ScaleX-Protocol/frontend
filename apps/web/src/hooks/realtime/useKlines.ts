import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import { useWebSocket } from '@/providers/websocketProvider';
import type { KlineData, KlineInterval, UseKlinesParams, UseKlinesReturn } from './types';
import { logger } from '@/utils/logger';

interface KlineResponse {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  numberOfTrades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
  ignored?: string;
}

interface KlineWsMessage {
  type: 'kline';
  symbol: string;
  interval: string;
  data: {
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;
    quoteVolume: string;
    numberOfTrades: number;
    takerBuyBaseVolume: string;
    takerBuyQuoteVolume: string;
    isFinal: boolean;
  };
}

/**
 * Hook that combines REST API fetching with WebSocket subscriptions for kline/candlestick data.
 * Provides initial data loading from /api/kline and real-time updates via {symbol}@kline_{interval} stream.
 *
 * @param params - Configuration parameters
 * @param params.symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @param params.interval - Kline interval (e.g., '1m', '5m', '1h', '1d')
 * @param params.startTime - Start time in milliseconds (optional)
 * @param params.endTime - End time in milliseconds (optional)
 * @param params.limit - Maximum number of klines to fetch (default: 500)
 * @param params.enableRealtime - Whether to enable WebSocket updates (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading, currentKline, isConnected } = useKlines({
 *   symbol: 'BTCUSDT',
 *   interval: '1h',
 *   limit: 100,
 *   enableRealtime: true
 * });
 * ```
 */
export function useKlines(params: UseKlinesParams): UseKlinesReturn {
  const { symbol, interval, startTime, endTime, limit = 500, enableRealtime = true } = params;
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const { socket, connectionState, sendMessage } = useWebSocket();
  const isConnected = connectionState === 'open';

  // Initial kline data fetch via REST API
  const {
    data: initialData,
    isLoading,
    error,
    refetch
  } = useQuery<KlineResponse[], Error>({
    queryKey: ['klines', symbol, interval, startTime, endTime, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (symbol) searchParams.set('symbol', symbol);
      if (interval) searchParams.set('interval', interval);
      if (startTime) searchParams.set('startTime', String(startTime));
      if (endTime) searchParams.set('endTime', String(endTime));
      if (limit) searchParams.set('limit', String(limit));
      const query = searchParams.toString();
      return fetchIndexerAPI<KlineResponse[]>(`/kline?${query}`);
    },
    enabled: !!symbol && !!interval,
    refetchInterval: enableRealtime ? false : 60000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
  });

  // Set initial klines from REST response
  useEffect(() => {
    if (initialData && klines.length === 0) {
      const normalizedKlines: KlineData[] = initialData.map(kline => ({
        openTime: kline.openTime,
        open: kline.open,
        high: kline.high,
        low: kline.low,
        close: kline.close,
        volume: kline.volume,
        closeTime: kline.closeTime,
        quoteVolume: kline.quoteVolume,
        numberOfTrades: kline.numberOfTrades,
        takerBuyBaseVolume: kline.takerBuyBaseVolume,
        takerBuyQuoteVolume: kline.takerBuyQuoteVolume,
        isRealtime: false
      }));
      setKlines(normalizedKlines);
      setLastUpdate(Date.now());
    }
  }, [initialData, klines.length]);

  // Reset klines when symbol or interval changes
  useEffect(() => {
    setKlines([]);
    setIsRealtime(false);
  }, [symbol, interval]);

  // WebSocket subscription for real-time kline updates
  useEffect(() => {
    if (!socket || !symbol || !interval || !enableRealtime || !isConnected) {
      return;
    }

    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;

    logger.info(`[Klines] Setting up real-time updates for ${symbol} (${interval})`);

    // Subscribe to kline stream
    const subscriptionMessage = {
      id: Date.now() + Math.random(),
      method: 'SUBSCRIBE',
      params: [streamName]
    };
    sendMessage(subscriptionMessage);

    // Handle incoming messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        // Check if this is a kline update for our symbol/interval
        if (message.type === 'kline' && message.symbol?.toLowerCase() === symbol.toLowerCase()) {
          const klineData = message.data as KlineWsMessage['data'];

          setKlines(prev => {
            const newKline: KlineData = {
              openTime: klineData.openTime,
              open: klineData.open,
              high: klineData.high,
              low: klineData.low,
              close: klineData.close,
              volume: klineData.volume,
              closeTime: klineData.closeTime,
              quoteVolume: klineData.quoteVolume,
              numberOfTrades: klineData.numberOfTrades,
              takerBuyBaseVolume: klineData.takerBuyBaseVolume,
              takerBuyQuoteVolume: klineData.takerBuyQuoteVolume,
              isRealtime: true
            };

            // Find and update existing kline or add new one
            const existingIndex = prev.findIndex(k => k.openTime === klineData.openTime);

            if (existingIndex >= 0) {
              // Update existing kline
              const updated = [...prev];
              updated[existingIndex] = newKline;
              return updated;
            } else if (klineData.isFinal) {
              // Add new completed kline at the end
              return [...prev, newKline].slice(-limit);
            } else {
              // Update or add the current (incomplete) kline
              if (prev.length > 0 && prev[prev.length - 1].closeTime < klineData.closeTime) {
                return [...prev, newKline].slice(-limit);
              }
              return prev;
            }
          });

          setLastUpdate(Date.now());
          setIsRealtime(true);

          logger.debug(`[Klines] Update received for ${symbol}`, {
            openTime: klineData.openTime,
            close: klineData.close,
            isFinal: klineData.isFinal
          });
        }
      } catch (err) {
        logger.error('Failed to parse kline WebSocket message', { error: err });
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);

      // Unsubscribe from kline stream
      const unsubscribeMessage = {
        id: Date.now(),
        method: 'UNSUBSCRIBE',
        params: [streamName]
      };
      sendMessage(unsubscribeMessage);

      logger.info(`[Klines] Cleaning up real-time updates for ${symbol} (${interval})`);
    };
  }, [socket, symbol, interval, limit, enableRealtime, isConnected, sendMessage]);

  // Calculate derived values
  const currentKline = useMemo(() => {
    return klines.length > 0 ? klines[klines.length - 1] : null;
  }, [klines]);

  const refresh = useCallback(() => {
    setKlines([]);
    setIsRealtime(false);
    refetch();
  }, [refetch]);

  return {
    data: klines.length > 0 ? klines : null,
    isLoading,
    error,
    refresh,
    isConnected: isConnected && enableRealtime,
    isRealtime,
    lastUpdate,
    currentKline
  };
}

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAPI } from '@/hooks/fetchAPI';
import { useWebSocket } from '@/providers/websocketProvider';
import { logger } from '@/utils/logger';
import type { KlineData, KlineInterval, UseKlinesParams, UseKlinesReturn } from './types';

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

export function useKlines(params: UseKlinesParams): UseKlinesReturn {
  const { symbol, interval, startTime, endTime, limit = 500, enableRealtime = true } = params;
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const { socket, connectionState, sendMessage } = useWebSocket();
  const isConnected = connectionState === 'open';

  const {
    data: initialData,
    isLoading,
    error,
    refetch,
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
      return fetchAPI<KlineResponse[]>(`/kline?${query}`);
    },
    enabled: !!symbol && !!interval,
    refetchInterval: enableRealtime ? false : 60000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
  });

  useEffect(() => {
    if (initialData && klines.length === 0) {
      const normalizedKlines: KlineData[] = initialData.map((kline) => ({
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
        isRealtime: false,
      }));
      setKlines(normalizedKlines);
      setLastUpdate(Date.now());
    }
  }, [initialData, klines.length]);

  useEffect(() => {
    setKlines([]);
    setIsRealtime(false);
  }, [symbol, interval]);

  useEffect(() => {
    if (!socket || !symbol || !interval || !enableRealtime || !isConnected) return;

    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    sendMessage({ id: Date.now() + Math.random(), method: 'SUBSCRIBE', params: [streamName] });

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'kline' && message.symbol?.toLowerCase() === symbol.toLowerCase()) {
          const klineData = message.data as KlineWsMessage['data'];

          setKlines((prev) => {
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
              isRealtime: true,
            };

            const existingIndex = prev.findIndex((k) => k.openTime === klineData.openTime);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = newKline;
              return updated;
            } else if (klineData.isFinal) {
              return [...prev, newKline].slice(-limit);
            } else {
              if (prev.length > 0 && prev[prev.length - 1].closeTime < klineData.closeTime) {
                return [...prev, newKline].slice(-limit);
              }
              return prev;
            }
          });

          setLastUpdate(Date.now());
          setIsRealtime(true);
        }
      } catch (err) {
        logger.error('Failed to parse kline WebSocket message', { error: err });
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
      sendMessage({ id: Date.now(), method: 'UNSUBSCRIBE', params: [streamName] });
    };
  }, [socket, symbol, interval, limit, enableRealtime, isConnected, sendMessage]);

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
    currentKline,
  };
}

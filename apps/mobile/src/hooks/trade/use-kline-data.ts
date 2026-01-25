import * as React from 'react';
import { useKline } from '~/src/hooks/trading';
import type { KlineData } from '@scalex/types';
import { getCachedData, setCachedData, CACHE_DURATIONS } from '~/lib/cache';

export type TimeFrameInterval = '1h' | '4h' | '1d' | '1w' | '1M';

export interface VictoryCandleData {
  x: number;
  y: [number, number, number, number]; // [open, high, low, close]
}

interface UseKlineDataParams {
  symbol: string;
  interval: TimeFrameInterval;
}

interface UseKlineDataReturn {
  data: VictoryCandleData[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const CANDLE_LIMIT = 100;
const POLL_INTERVAL = 10000; // 10 seconds

export function useKlineData({
  symbol,
  interval,
}: UseKlineDataParams): UseKlineDataReturn {
  const cacheKey = `cache:klines:${symbol}:${interval}`;

  // Try to get cached klines first
  const cachedKlines = React.useMemo(() => {
    return getCachedData<VictoryCandleData[]>(cacheKey);
  }, [cacheKey]);

  const [localCache, setLocalCache] = React.useState<VictoryCandleData[]>(cachedKlines || []);

  // Map interval to API format
  const apiInterval = React.useMemo(() => {
    const intervalMap: Record<TimeFrameInterval, '1m' | '5m' | '30m' | '1h' | '1d'> = {
      '1h': '1h',
      '4h': '1h', // API doesn't support 4h, use 1h
      '1d': '1d',
      '1w': '1d', // API doesn't support 1w, use 1d
      '1M': '1d', // API doesn't support 1M, use 1d
    };
    return intervalMap[interval] || '1h';
  }, [interval]);

  // Determine if we should poll (intervals < 1d)
  const shouldPoll = React.useMemo(() => {
    return interval === '1h' || interval === '4h';
  }, [interval]);

  const {
    data: rawData,
    isLoading,
    isError,
    refetch,
  } = useKline(
    {
      symbol,
      interval: apiInterval,
      limit: CANDLE_LIMIT,
    },
    {
      refetchInterval: shouldPoll ? POLL_INTERVAL : false,
      enabled: !!symbol,
    }
  );

  // Transform data to Victory format
  const transformedData = React.useMemo<VictoryCandleData[]>(() => {
    if (!rawData || rawData.length === 0) {
      return localCache;
    }

    // Limit to last 100 candles
    const limitedData = rawData.slice(-CANDLE_LIMIT);

    return limitedData.map((candle: KlineData): VictoryCandleData => ({
      x: candle.openTime,
      y: [
        parseFloat(candle.open),
        parseFloat(candle.high),
        parseFloat(candle.low),
        parseFloat(candle.close),
      ],
    }));
  }, [rawData, localCache]);

  // Update cache when transformed data changes
  React.useEffect(() => {
    if (transformedData.length > 0) {
      setLocalCache(transformedData);
      setCachedData(cacheKey, transformedData, CACHE_DURATIONS.KLINES);
    }
  }, [transformedData, cacheKey]);

  // Return cached data while loading
  const displayData = React.useMemo(() => {
    if (isLoading && localCache.length > 0) {
      return localCache;
    }
    return transformedData;
  }, [isLoading, localCache, transformedData]);

  return {
    data: displayData,
    isLoading: isLoading && !localCache.length,
    isError,
    refetch,
  };
}

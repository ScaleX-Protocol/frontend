import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { KlineData, TradingPair } from '../../types/chart.types';
import { RESOLUTION_MAPPING } from '../../types/chart.types';
import { Endpoints } from '@/configs/endpoints';
import { logger } from '@/utils/prodLogger';
import { useWebSocketSubscriptions, type KlineUpdate } from '@/hooks/useWebSocketSubscriptions';

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type Interval = '1' | '5' | '30' | '60' | '1D';

interface ExtendedTradingPair extends TradingPair {
  displaySymbol: string;
}

interface TradingViewSymbol {
  symbol: string;
  full_name: string;
  description: string;
  exchange: string;
  ticker: string;
  type: string;
}

interface TradingViewSymbolInfo {
  name: string;
  ticker: string;
  description: string;
  type: string;
  session: string;
  timezone: string;
  exchange: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_weekly_and_monthly: boolean;
  supported_resolutions: string[];
  volume_precision: number;
  data_status: string;
  full_name: string;
}

interface PeriodParams {
  from: number;
  to: number;
  firstDataRequest?: boolean;
}

interface BarMeta {
  noData?: boolean;
  nextTime?: number;
}

const convertPrice = (value: string | number, decimals: number): number => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue / Math.pow(10, decimals);
};

export function useTradingViewDatafeed(
  pairs: TradingPair[] | undefined,
  onIntervalChange: (interval: Interval) => void,
) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const log = logger.withContext({ hook: 'useTradingViewDatafeed' });
  const { subscribeToKline, isConnected } = useWebSocketSubscriptions();

  // Stable refs to prevent datafeed recreation
  const isConnectedRef = useRef(isConnected);
  const subscribeToKlineRef = useRef(subscribeToKline);
  const pairsRef = useRef(pairs);

  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);
  useEffect(() => { subscribeToKlineRef.current = subscribeToKline; }, [subscribeToKline]);
  useEffect(() => { pairsRef.current = pairs; }, [pairs]);

  const subscriptionRef = useRef<{
    unsubscribe: (() => void) | null;
    onTick: ((bar: Bar) => void) | null;
    symbolInfo: TradingViewSymbolInfo | null;
    resolution: string | null;
  }>({
    unsubscribe: null,
    onTick: null,
    symbolInfo: null,
    resolution: null,
  });

  useEffect(() => {
    if (isConnected && subscriptionRef.current.symbolInfo && subscriptionRef.current.resolution && subscriptionRef.current.onTick) {
      const { symbolInfo, resolution } = subscriptionRef.current;
      const mappedInterval = RESOLUTION_MAPPING[resolution];

      if (mappedInterval) {
        if (subscriptionRef.current.unsubscribe) {
          subscriptionRef.current.unsubscribe();
        }

        // Look up pair to get correct decimals for price conversion
        const concatenatedSymbol = symbolInfo.name.replace('/', '');
        const pair = pairsRef.current?.find((p) =>
          p.symbol === concatenatedSymbol ||
          p.symbol === symbolInfo.name ||
          `${p.baseAsset}/${p.quoteAsset}` === symbolInfo.name
        );
        const decimals = pair?.quoteDecimals ?? 18;

        const unsubscribe = subscribeToKline(
          symbolInfo.name,
          mappedInterval,
          (klineUpdate: KlineUpdate) => {
            const bar: Bar = {
              time: klineUpdate.openTime,
              open: convertPrice(klineUpdate.open, decimals),
              high: convertPrice(klineUpdate.high, decimals),
              low: convertPrice(klineUpdate.low, decimals),
              close: convertPrice(klineUpdate.close, decimals),
              volume: parseFloat(klineUpdate.volume),
            };

            if (subscriptionRef.current.onTick) {
              subscriptionRef.current.onTick(bar);
            }
          }
        );

        subscriptionRef.current.unsubscribe = unsubscribe;
      }
    }
  }, [isConnected, subscribeToKline]);

  const cancelPending = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const fetchPairs = useCallback(async (): Promise<TradingPair[]> => {
    try {
      const url = `${Endpoints.indexer}/pairs`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch pairs');
      }

      const data: any[] = await response.json();

      return data.map((pair: any): TradingPair => ({
        symbol: pair.symbol,
        baseAsset: pair.baseAsset,
        quoteAsset: pair.quoteAsset,
        poolId: pair.poolId,
        baseDecimals: pair.baseDecimals || 6,
        quoteDecimals: pair.quoteDecimals || 6,
      }));
    } catch (error) {
      log.error('Error fetching pairs', error);
      return [];
    }
  }, []);

  const fetchKlines = useCallback(
    async (params: { symbol: string; resolution: string; from: number; to: number }): Promise<Bar[]> => {
      cancelPending();
      abortControllerRef.current = new AbortController();

      try {
        const mappedInterval = RESOLUTION_MAPPING[params.resolution];
        if (!mappedInterval) {
          throw new Error('Unsupported resolution');
        }

        const concatenatedSymbol = params.symbol.replace('/', '');
        const pair = pairsRef.current?.find((p) =>
          p.symbol === concatenatedSymbol ||
          p.symbol === params.symbol ||
          `${p.baseAsset}/${p.quoteAsset}` === params.symbol
        );

        const decimals = pair?.quoteDecimals ?? 18;
        const minValidTimestamp = 1640995200000;
        const adjustedFrom = Math.max(params.from, minValidTimestamp);
        const adjustedTo = Math.max(params.to, minValidTimestamp);

        const searchParams = new URLSearchParams({
          symbol: params.symbol,
          interval: mappedInterval,
          startTime: adjustedFrom.toString(),
          endTime: adjustedTo.toString(),
          limit: '5000'
        });

        const url = `${Endpoints.indexer}/api/kline?${searchParams.toString()}`;
        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: KlineData[] | any[][] = await response.json();

        const bars = data.map((d: KlineData | any[]) => {
          if (Array.isArray(d)) {
            return {
              time: d[0],
              open: convertPrice(d[1], decimals),
              high: convertPrice(d[2], decimals),
              low: convertPrice(d[3], decimals),
              close: convertPrice(d[4], decimals),
              volume: Number(d[5]),
            };
          }

          return {
            time: d.openTime,
            open: convertPrice(d.open, decimals),
            high: convertPrice(d.high, decimals),
            low: convertPrice(d.low, decimals),
            close: convertPrice(d.close, decimals),
            volume: Number(d.volume),
          };
        });

        bars.sort((a, b) => a.time - b.time);
        return bars;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return [];
        }
        log.error('Kline fetch error', err);
        throw err;
      }
    },
    [cancelPending],
  );

  const datafeed = useMemo(
    () => ({
      onReady: (cb: any) => {
        const config = {
          supported_resolutions: ['1', '5', '30', '60', '1D'],
          supports_marks: true,
          supports_timescale_marks: true,
          supports_time: true,
          supports_search: true,
          supports_group_request: false,
          supports_data_access_by_group: false,
          exchanges: [
            {
              value: 'ScaleX',
              name: 'ScaleX',
              desc: 'ScaleX Exchange'
            }
          ],
          symbols_types: [
            {
              name: 'crypto',
              value: 'crypto'
            }
          ],
          supports_historical_data: true,
          supports_realtime: true,
          charts_storage_url: null,
          charts_storage_api_version: "1.1",
        };
        cb(config);
      },

      searchSymbols: async (userInput: string, onResult: (symbols: TradingViewSymbol[]) => void) => {
        try {
          const availablePairs = await fetchPairs();
          const tradingViewPairs: ExtendedTradingPair[] = availablePairs.map(p => ({
            ...p,
            displaySymbol: `${p.baseAsset}/${p.quoteAsset}`
          }));

          const filtered = tradingViewPairs.filter((p) =>
            p.displaySymbol.toLowerCase().includes(userInput.toLowerCase()) ||
            p.baseAsset.toLowerCase().includes(userInput.toLowerCase()) ||
            p.quoteAsset.toLowerCase().includes(userInput.toLowerCase())
          );

          const results: TradingViewSymbol[] = filtered.map((pair) => ({
            symbol: pair.displaySymbol,
            full_name: pair.displaySymbol,
            description: pair.displaySymbol,
            exchange: 'ScaleX',
            ticker: pair.displaySymbol,
            type: 'crypto',
          }));

          onResult(results);
        } catch (error) {
          log.error('Search error', error);
          onResult([]);
        }
      },

      resolveSymbol: (symbolName: string, onResolve: (symbolInfo: TradingViewSymbolInfo) => void, onError: (error: string) => void) => {
        try {
          const concatenatedSymbol = symbolName.replace('/', '');
          const pair = pairsRef.current?.find((p) =>
            p.symbol === concatenatedSymbol ||
            p.symbol === symbolName ||
            `${p.baseAsset}/${p.quoteAsset}` === symbolName
          );

          const symbolInfo: TradingViewSymbolInfo = {
            name: symbolName,
            ticker: symbolName,
            description: pair?.symbol || symbolName,
            type: 'crypto',
            session: '24x7',
            timezone: 'Etc/UTC',
            exchange: 'ScaleX',
            minmov: 1,
            pricescale: 100,
            has_intraday: true,
            has_weekly_and_monthly: false,
            supported_resolutions: ['1', '5', '30', '60', '1D'],
            volume_precision: 8,
            data_status: 'streaming',
            full_name: pair?.symbol || symbolName,
          };

          setTimeout(() => {
            onResolve(symbolInfo);
          }, 0);
        } catch (error) {
          log.error('TradingView resolveSymbol error', error);
          onError('Failed to resolve symbol');
        }
      },

      getBars: async (symbolInfo: TradingViewSymbolInfo, resolution: string, periodParams: PeriodParams, onResult: (bars: Bar[], meta?: BarMeta) => void, onError: (error: string) => void) => {
        try {
          const minValidTimestampSeconds = 1577836800; // add 2020-01-01 00:00:00 on timestamp as minimum valid timestamp
          if (periodParams.to < minValidTimestampSeconds) {
            onResult([], { noData: true });
            return;
          }

          // Convert to milliseconds for API call
          const bars = await fetchKlines({
            symbol: symbolInfo.name,
            resolution,
            from: periodParams.from * 1000,
            to: periodParams.to * 1000,
          });

          if (bars.length === 0) {
            // When no bars are returned, signal that there's no more historical data
            onResult([], { noData: true });
          } else {
            const validBars = bars.filter(bar => {
              const isValid = bar &&
                typeof bar.time === 'number' &&
                typeof bar.open === 'number' &&
                typeof bar.high === 'number' &&
                typeof bar.low === 'number' &&
                typeof bar.close === 'number' &&
                bar.time > 0 &&
                bar.open > 0 &&
                bar.high >= bar.low &&
                bar.high >= Math.max(bar.open, bar.close) &&
                bar.low <= Math.min(bar.open, bar.close);
              
              return isValid;
            });

            if (validBars.length === 0) {
              onResult([], { noData: true });
            } else {
              const firstBarTime = validBars[0].time;
              const periodToMs = periodParams.to * 1000;
              if (periodToMs <= firstBarTime) {
                onResult([], { noData: true });
              } else {
                onResult(validBars, { noData: false });
              }
            }
          }
        } catch (e) {
          log.error('TradingView getBars error', e);
          onError('Failed to fetch bars');
        }
      },

      subscribeBars: (
        symbolInfo: TradingViewSymbolInfo,
        resolution: string,
        onTick: (bar: Bar) => void,
        subscriberUID: string,
        onResetCacheNeededCallback?: () => void
      ) => {
        const validInterval = (['1', '5', '30', '60', '1D'].includes(resolution) ? resolution : '60') as Interval;
        onIntervalChange(validInterval);

        subscriptionRef.current.onTick = onTick;
        subscriptionRef.current.symbolInfo = symbolInfo;
        subscriptionRef.current.resolution = resolution;

        if (subscriptionRef.current.unsubscribe) {
          subscriptionRef.current.unsubscribe();
        }

        const mappedInterval = RESOLUTION_MAPPING[resolution];

        if (!mappedInterval || !isConnectedRef.current) {
          return;
        }

        // Look up pair to get correct decimals for price conversion
        const concatenatedSymbol = symbolInfo.name.replace('/', '');
        const pair = pairsRef.current?.find((p) =>
          p.symbol === concatenatedSymbol ||
          p.symbol === symbolInfo.name ||
          `${p.baseAsset}/${p.quoteAsset}` === symbolInfo.name
        );
        const decimals = pair?.quoteDecimals ?? 18;

        const unsubscribe = subscribeToKlineRef.current(
          symbolInfo.name,
          mappedInterval,
          (klineUpdate: KlineUpdate) => {
            const bar: Bar = {
              time: klineUpdate.openTime,
              open: convertPrice(klineUpdate.open, decimals),
              high: convertPrice(klineUpdate.high, decimals),
              low: convertPrice(klineUpdate.low, decimals),
              close: convertPrice(klineUpdate.close, decimals),
              volume: parseFloat(klineUpdate.volume),
            };

            if (subscriptionRef.current.onTick) {
              subscriptionRef.current.onTick(bar);
            }
          }
        );

        subscriptionRef.current.unsubscribe = unsubscribe;
      },

      unsubscribeBars: (subscriberUID: string) => {
        if (subscriptionRef.current.unsubscribe) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current.unsubscribe = null;
        }

        subscriptionRef.current.onTick = null;
        subscriptionRef.current.symbolInfo = null;
        subscriptionRef.current.resolution = null;

        cancelPending();
      },
    }),
    [fetchPairs, fetchKlines, cancelPending, onIntervalChange],
  );

  return datafeed;
}

// Export types for external use
export type { Bar, Interval, ExtendedTradingPair, TradingViewSymbol, TradingViewSymbolInfo, PeriodParams, BarMeta };

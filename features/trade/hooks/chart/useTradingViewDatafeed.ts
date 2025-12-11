import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { KlineData, TradingPair } from '../../types/chart.types';
import { RESOLUTION_MAPPING } from '../../types/chart.types';
import { Endpoints } from '@/configs/endpoints';
import { logger } from '@/utils/prodLogger';

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// type Interval = '1m' | '5m' | '30m' | '1h' | '1d';
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
  // Ref to manage pending K-line requests for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const log = logger.withContext({ hook: 'useTradingViewDatafeed' });

  const cancelPending = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Function to fetch pairs (originally in PairsService.getPairs)
  const fetchPairs = useCallback(async (): Promise<TradingPair[]> => {
    try {
      const url = `${Endpoints.indexer}/pairs`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch pairs');
      }

      const data: any[] = await response.json();

      // Format pairs data for TradingView
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
  }, []); // Dependencies are stable

  // Function to fetch Klines (originally in KlineService.fetchKlines)
  const fetchKlines = useCallback(
    async (params: { symbol: string; resolution: string; from: number; to: number }): Promise<Bar[]> => {
      cancelPending(); // Cancel any previous pending request

      abortControllerRef.current = new AbortController();

      try {
        const mappedInterval = RESOLUTION_MAPPING[params.resolution];
        if (!mappedInterval) {
          throw new Error('Unsupported resolution');
        }

        const concatenatedSymbol = params.symbol.replace('/', '');
        const pair = pairs?.find((p) =>
          p.symbol === concatenatedSymbol ||
          p.symbol === params.symbol ||
          `${p.baseAsset}/${p.quoteAsset}` === params.symbol
        );

        // const decimals = pair?.quoteDecimals || 9;
        const decimals = 6;

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
        
        const url = `${Endpoints.indexer}/kline?${searchParams.toString()}`;

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: KlineData[] | any[][] = await response.json();

        // 🔍 DEBUG: Log first candle before and after conversion
        if (data.length > 0) {
          const firstRaw = data[0];
          log.debug('First raw candle', { firstRaw });
          
          const firstConverted = Array.isArray(firstRaw) ? {
            time: firstRaw[0],
            open: convertPrice(firstRaw[1], decimals),
            high: convertPrice(firstRaw[2], decimals),
            low: convertPrice(firstRaw[3], decimals),
            close: convertPrice(firstRaw[4], decimals),
            volume: Number(firstRaw[5]),
          } : {
            time: firstRaw.openTime,
            open: convertPrice(firstRaw.open, decimals),
            high: convertPrice(firstRaw.high, decimals),
            low: convertPrice(firstRaw.low, decimals),
            close: convertPrice(firstRaw.close, decimals),
            volume: Number(firstRaw.volume),
          };
          
          log.debug('First converted candle', { firstConverted });
        }

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

        log.debug(`Returning ${bars.length} bars`, { barCount: bars.length });
        log.debug('=== END DEBUG ===');

        return bars;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return [];
        }
        log.error('Kline fetch error', err);
        throw err;
      }
    },
    [pairs, cancelPending],
  ); // Dependency on 'pairs' and 'cancelPending'

  const datafeed = useMemo(
    () => ({
      // Configuration data
      onReady: (cb: any) => {
        cb({
          supported_resolutions: ['1', '5', '30', '60', '1D'],
          supports_marks: true,
          supports_timescale_marks: true,
          supports_time: true,
          supports_search: true,
          // Configure proper data handling
          supports_group_request: false,
          supports_data_access_by_group: false,
          // Set proper bars configuration for multiple candles display
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
          // Enable proper historical data handling
          supports_historical_data: true,
          supports_realtime: false,
          // Configure chart display behavior
          charts_storage_url: null,
          charts_storage_api_version: "1.1",
        });
      },

      // Symbol search dropdown
      searchSymbols: async (userInput: string, onResult: (symbols: TradingViewSymbol[]) => void) => {
        try {
          const availablePairs = await fetchPairs(); // Direct API call via helper function

          // Convert pairs to TradingView format and filter
          const tradingViewPairs: ExtendedTradingPair[] = availablePairs.map(p => ({
            ...p,
            displaySymbol: `${p.baseAsset}/${p.quoteAsset}` // Convert to TradingView format
          }));

          // Filter by user input
          const filtered = tradingViewPairs.filter((p) =>
            p.displaySymbol.toLowerCase().includes(userInput.toLowerCase()) ||
            p.baseAsset.toLowerCase().includes(userInput.toLowerCase()) ||
            p.quoteAsset.toLowerCase().includes(userInput.toLowerCase())
          );

          const results: TradingViewSymbol[] = filtered.map((pair) => ({
            symbol: pair.displaySymbol, // Use slash format for TradingView
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

      // Resolve symbol info (populates the chart settings)
      resolveSymbol: (symbolName: string, onResolve: (symbolInfo: TradingViewSymbolInfo) => void, onError: (error: string) => void) => {
        try {
          // The pairs API returns symbols like "gsWETHgsUSDC" but TradingView uses "gsWETH/gsUSDC"
          // We need to map between these formats
          const concatenatedSymbol = symbolName.replace('/', ''); // gsWETH/gsUSDC -> gsWETHgsUSDC
          const pair = pairs?.find((p) =>
            p.symbol === concatenatedSymbol ||
            p.symbol === symbolName ||
            `${p.baseAsset}/${p.quoteAsset}` === symbolName
          );

          const pricescale = Math.pow(10, 2);

          const symbolInfo: TradingViewSymbolInfo = {
            name: symbolName,
            ticker: symbolName,
            description: pair?.symbol || symbolName,
            type: 'crypto',
            session: '24x7',
            timezone: 'Etc/UTC',
            exchange: 'ScaleX',
            minmov: 1,
            pricescale: pricescale,
            has_intraday: true,
            has_weekly_and_monthly: false,
            supported_resolutions: ['1', '5', '30', '60', '1D'],
            volume_precision: 8,
            data_status: 'streaming',
            full_name: pair?.symbol || symbolName,
          };

          // Make resolveSymbol asynchronous as recommended by TradingView
          setTimeout(() => {
            onResolve(symbolInfo);
          }, 0);
        } catch (error) {
          log.error('TradingView resolveSymbol error', error);
          onError('Failed to resolve symbol');
        }
      },

      // Fetch historical data (required for chart display)
      getBars: async (symbolInfo: TradingViewSymbolInfo, resolution: string, periodParams: PeriodParams, onResult: (bars: Bar[], meta?: BarMeta) => void, onError: (error: string) => void) => {
        try {
          // periodParams.from and periodParams.to are in seconds, need to convert to milliseconds
          const bars = await fetchKlines({
            // Direct API call via helper function
            symbol: symbolInfo.name,
            resolution,
            from: periodParams.from * 1000,
            to: periodParams.to * 1000,
          });

          if (bars.length === 0) {
            onResult([], { noData: true });
          } else {
            // Validate bar data format before returning
            const validBars = bars.filter(bar =>
              bar &&
              typeof bar.time === 'number' &&
              typeof bar.open === 'number' &&
              typeof bar.high === 'number' &&
              typeof bar.low === 'number' &&
              typeof bar.close === 'number' &&
              bar.time > 0 &&
              bar.open > 0 &&
              bar.high >= bar.low &&
              bar.high >= Math.max(bar.open, bar.close) &&
              bar.low <= Math.min(bar.open, bar.close)
            );

            if (validBars.length === 0) {
              onResult([], { noData: true });
            } else {
              // Correct metadata format
              const meta: BarMeta = {
                noData: false,
                // Don't set nextTime to prevent infinite loading
              };

              onResult(validBars, meta);
            }
          }
        } catch (e) {
          log.error('TradingView getBars error', e);
          onError('Failed to fetch bars');
        }
      },

      // Setup for real-time subscription
      subscribeBars: (resolution: string) => {
        // Inform the parent component about the current interval set by the user
        // resolution is already in TradingView format ('1', '5', '30', '60', '1D')
        // so we pass it directly, not the mapped API format
        const validInterval = (['1', '5', '30', '60', '1D'].includes(resolution) ? resolution : '60') as Interval;
        onIntervalChange(validInterval);
        // In a real app, 'onTick' would be saved here for the subscription hook to use.
      },

      unsubscribeBars: () => {
        cancelPending(); // Cleanup any pending requests on unsubscribe
      },
    }),
    [pairs, fetchPairs, fetchKlines, cancelPending, onIntervalChange],
  );

  return datafeed;
}

// Export types for external use
export type { Bar, Interval, ExtendedTradingPair, TradingViewSymbol, TradingViewSymbolInfo, PeriodParams, BarMeta };

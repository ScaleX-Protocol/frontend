import { useCallback, useMemo, useRef } from 'react';
import type { KlineData, TradingPair } from '../../types/chart.types';
import { Endpoints } from '@/configs/endpoints';

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type Interval = '1m' | '5m' | '30m' | '1h' | '1d';

const RESOLUTION_MAPPING: Record<string, string> = {
  '1': '1m',
  '5': '5m',
  '30': '30m',
  '60': '1h',
  '1D': '1d',
};

const convertPrice = (value: string | number, decimals: number): number => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue / Math.pow(10, decimals);
};

const normalizeSymbol = (symbol: string): string => symbol.replace('/', '');

export function useTradingViewDatafeed(
  pairs: TradingPair[] | undefined,
  onIntervalChange: (interval: Interval) => void,
) {
  // Ref to manage pending K-line requests for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

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

      const data = await response.json();

      // Format pairs data for TradingView
      return data.map((pair: any) => ({
        symbol: pair.symbol,
        baseAsset: pair.baseAsset,
        quoteAsset: pair.quoteAsset,
        displayName: `${pair.baseAsset}/${pair.quoteAsset}`,
        poolId: pair.poolId,
        baseDecimals: pair.baseDecimals || 18,
        quoteDecimals: pair.quoteDecimals || 18,
      }));
    } catch (error) {
      console.error('Error fetching pairs:', error);
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

        // Find decimals needed for price conversion
        const normalizedSymbol = normalizeSymbol(params.symbol);
        const pair = pairs?.find(
          // Use 'pairs' from hook scope
          (p) => p.symbol === params.symbol || p.symbol === normalizedSymbol,
        );
        const decimals = pair?.quoteDecimals || 6;

        const url =
          `${Endpoints.indexer}/kline?` +
          `symbol=${normalizedSymbol}&interval=${mappedInterval}&` +
          `startTime=${params.from}&endTime=${params.to}&limit=5000`; // Use normalized symbol

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: KlineData[] = await response.json();

        return data.map((d: KlineData) => ({
          time: d.openTime, // TradingView expects openTime in milliseconds
          open: convertPrice(d.open, decimals),
          high: convertPrice(d.high, decimals),
          low: convertPrice(d.low, decimals),
          close: convertPrice(d.close, decimals),
          volume: Number(d.volume),
        }));
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return [];
        }
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
        });
      },

      // Symbol search dropdown
      searchSymbols: async (userInput: string, exchange: string, symbolType: string, onResult: any) => {
        try {
          const availablePairs = await fetchPairs(); // Direct API call via helper function

          // Filter by user input on the displayName (e.g., WETH/USDC)
          const filtered = availablePairs.filter((p) => p.symbol?.toLowerCase().includes(userInput.toLowerCase()));

          onResult(
            filtered.map((pair) => ({
              symbol: pair.symbol,
              full_name: pair.symbol,
              description: pair.symbol,
              exchange: 'MOCK-GTX',
              ticker: pair.symbol,
              type: 'crypto',
            })),
          );
        } catch (error) {
          console.error('Search error:', error);
          onResult([]);
        }
      },

      // Resolve symbol info (populates the chart settings)
      resolveSymbol: (symbolName: string, onResolve: any, onError: any) => {
        try {
          const pair = pairs?.find((p) => p.symbol === symbolName || p.symbol === normalizeSymbol(symbolName));
          const pricescale = 1000000; // Example large price scale for high precision

          onResolve({
            name: symbolName,
            ticker: symbolName,
            type: 'crypto',
            session: '24x7',
            timezone: 'Etc/UTC',
            minmov: 1,
            pricescale: pricescale, // Use a large price scale for high precision
            has_intraday: true,
            supported_resolutions: ['1', '5', '30', '60', '1D'],
            data_status: 'streaming',
            base_name: [pair?.baseAsset, pair?.quoteAsset], // Example for display
            description: pair?.symbol,
          });
        } catch (error) {
          onError('Failed to resolve symbol');
        }
      },

      // Fetch historical data (required for chart display)
      getBars: async (symbolInfo: any, resolution: string, periodParams: any, onResult: any, onError: any) => {
        try {
          // periodParams.from and periodParams.to are in seconds, need to convert to milliseconds
          const bars = await fetchKlines({
            // Direct API call via helper function
            symbol: symbolInfo.name,
            resolution,
            from: periodParams.from * 1000,
            to: periodParams.to * 1000,
          });

          onResult(bars, { noData: !bars.length });
        } catch (e) {
          onError('Failed to fetch bars');
        }
      },

      // Setup for real-time subscription
      subscribeBars: (symbolInfo: any, resolution: any, onTick: any) => {
        // Inform the parent component about the current interval set by the user
        onIntervalChange((RESOLUTION_MAPPING[resolution] || '1d') as Interval);
        // In a real app, 'onTick' would be saved here for the subscription hook to use.
        console.log(`Subscribing to ${symbolInfo.name} at resolution ${resolution}`);
      },

      unsubscribeBars: (subscriberUID: any) => {
        console.log('Unsubscribing bars...');
        cancelPending(); // Cleanup any pending requests on unsubscribe
      },
    }),
    [pairs, fetchPairs, fetchKlines, cancelPending, onIntervalChange],
  );

  return datafeed;
}

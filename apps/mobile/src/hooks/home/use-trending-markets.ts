import * as React from 'react';
import { useMarkets, useTicker24hr } from '~/src/hooks/trading';
import type { Market as ApiMarket, Ticker24hr } from '@scalex/types';
import { getCachedData, setCachedData, CACHE_DURATIONS } from '~/lib/cache';

export interface Market {
  symbol: string;
  name?: string;
  price: number;
  change24h: number;
  volume24h: number;
}

interface UseTrendingMarketsResult {
  markets: Market[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useTrendingMarkets(): UseTrendingMarketsResult {
  // Try to get cached markets first
  const cachedMarkets = React.useMemo(() => {
    return getCachedData<Market[]>('cache:trending_markets');
  }, []);

  // Fetch all markets
  const {
    data: marketsData,
    isLoading: marketsLoading,
    isError: marketsError,
    refetch: refetchMarkets,
  } = useMarkets({});

  // Fetch 24h ticker data for all markets
  const markets = marketsData ?? [];
  const symbols = React.useMemo(
    () => markets.map((m) => m.symbol).filter(Boolean),
    [markets]
  );

  // Create individual ticker queries for each symbol
  const tickerQueries = symbols.map((symbol) => {
    const { data: tickerData } = useTicker24hr(symbol);
    return tickerData;
  });

  // Process and sort markets by volume
  const processedMarkets = React.useMemo<Market[]>(() => {
    if (!marketsData || marketsData.length === 0) {
      return [];
    }

    // Create a map of symbol -> ticker data
    const tickerMap = new Map<string, Ticker24hr>();
    tickerQueries.forEach((ticker) => {
      if (ticker) {
        tickerMap.set(ticker.symbol, ticker);
      }
    });

    // Transform and enrich market data
    const enriched = marketsData
      .map((market: ApiMarket): Market | null => {
        const ticker = tickerMap.get(market.symbol);

        return {
          symbol: market.symbol,
          name: market.baseAsset,
          price: ticker ? parseFloat(ticker.lastPrice) : parseFloat(market.latestPrice),
          change24h: ticker ? parseFloat(ticker.priceChangePercent) : 0,
          volume24h: ticker ? parseFloat(ticker.quoteVolume) : parseFloat(market.volumeInQuote),
        };
      })
      .filter((m): m is Market => m !== null);

    // Sort by volume (descending) and take top 10
    return enriched
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 10);
  }, [marketsData, tickerQueries]);

  // Cache processed markets when data changes
  React.useEffect(() => {
    if (processedMarkets.length > 0) {
      setCachedData('cache:trending_markets', processedMarkets, CACHE_DURATIONS.MARKETS);
    }
  }, [processedMarkets]);

  // Return cached data while loading
  const displayMarkets = React.useMemo(() => {
    if (marketsLoading && cachedMarkets && cachedMarkets.length > 0) {
      return cachedMarkets;
    }
    return processedMarkets;
  }, [marketsLoading, cachedMarkets, processedMarkets]);

  // Setup polling with 5s interval
  React.useEffect(() => {
    const interval = setInterval(() => {
      refetchMarkets();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetchMarkets]);

  return {
    markets: displayMarkets,
    isLoading: marketsLoading && !cachedMarkets,
    isError: marketsError,
    refetch: refetchMarkets,
  };
}

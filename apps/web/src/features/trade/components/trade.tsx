'use client';

import { useState, useEffect } from 'react';
import { useMarkets, useTicker24hr, findDefaultMarket, useTokenLookupUtils } from '@scalex/service-trading';
import type { Market } from '@scalex/types';
import Chart from './chart/chart';
import History from './history/history';
import OrderBook from './orderBook/orderBook';
import PlaceOrder from './placeOrder/placeOrder';
import { logger } from '@/utils/prodLogger';

export default function Trade() {
  const { data, isLoading, error, refetch } = useMarkets();
  const { getMarketTokens } = useTokenLookupUtils();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const log = logger.withContext({ component: 'Trade' });

  // Set default market when data loads
  useEffect(() => {
    if (data && data.length > 0 && !selectedMarket) {
      const defaultMarket = findDefaultMarket(data);
      setSelectedMarket(defaultMarket);
    }
  }, [data, selectedMarket]);

  // Calculate symbol early for hooks
  const currentMarket = data && data.length > 0 ? (selectedMarket || findDefaultMarket(data)) : null;
  const symbol = currentMarket ? `${currentMarket.baseAsset}/${currentMarket.quoteAsset}` : '';

  // Fetch 24hr ticker data 
  const { data: ticker24hr } = useTicker24hr(symbol, {
    enabled: !!symbol && !!currentMarket,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#F06718] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#A0A0A0] text-sm">Loading markets...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    log.error('Error loading market data', error);
    refetch();
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-red-400">Error loading market data</div>
      </div>
    );
  }

  // No data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-[#A0A0A0]">No market data available</div>
      </div>
    );
  }

  // Invalid market
  if (!currentMarket || !currentMarket.baseAsset || !currentMarket.quoteAsset) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-[#A0A0A0]">Invalid market data structure</div>
      </div>
    );
  }

  // Get token information for the current market
  const { baseToken, quoteToken } = getMarketTokens(
    currentMarket.baseAsset,
    currentMarket.quoteAsset
  );

  const baseDecimals = baseToken?.decimals || 18;
  const quoteDecimals = quoteToken?.decimals || 6;
  
  // Format price
  const currentPrice = ticker24hr 
    ? (parseFloat(ticker24hr.lastPrice) / Math.pow(10, quoteDecimals)).toFixed(2)
    : (parseFloat(currentMarket.latestPrice) / Math.pow(10, quoteDecimals)).toFixed(2);
  
  // Format 24h stats
  const priceChange = ticker24hr ? parseFloat(ticker24hr.priceChangePercent) : 0;
  const highPrice = ticker24hr 
    ? (parseFloat(ticker24hr.highPrice) / Math.pow(10, quoteDecimals)).toFixed(2)
    : '--';
  const lowPrice = ticker24hr 
    ? (parseFloat(ticker24hr.lowPrice) / Math.pow(10, quoteDecimals)).toFixed(2)
    : '--';
  const volume = ticker24hr
    ? parseFloat(ticker24hr.volume).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : parseFloat(currentMarket.volume) === 0
      ? '0'
      : (parseFloat(currentMarket.volume) / Math.pow(10, baseDecimals)).toLocaleString();

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col gap-3">
      {/* Main Trading Interface */}
      <div className="grid grid-cols-[1fr_280px_300px] gap-3 h-[520px]">
        {/* Chart with Header */}
        <Chart 
          symbol={symbol}
          currentPrice={currentPrice}
          priceChange={priceChange}
          highPrice={highPrice}
          lowPrice={lowPrice}
          volume={volume}
          baseAsset={currentMarket.baseAsset}
          quoteAsset={currentMarket.quoteAsset}
        />
        
        {/* Order Book */}
        <OrderBook symbol={symbol} />
        
        {/* Place Order */}
        <PlaceOrder
          baseToken={{
            address: baseToken?.address || '',
            symbol: baseToken?.symbol || currentMarket.baseAsset,
            decimals: baseDecimals
          }}
          quoteToken={{
            address: quoteToken?.address || '',
            symbol: quoteToken?.symbol || currentMarket.quoteAsset,
            decimals: quoteDecimals
          }}
        />
      </div>

      {/* History Section */}
      <History symbol={symbol} baseDecimals={baseDecimals} quoteDecimals={quoteDecimals} />
    </div>
  );
}

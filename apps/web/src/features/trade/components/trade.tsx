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

  if (isLoading) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-gray-400">Loading markets...</div>
      </div>
    );
  }

  if (error) {
    log.error('Error loading market data', error);
    refetch();
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-red-400">Error loading market data</div>
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-gray-400">No market data available</div>
      </div>
    );
  }

  if (!currentMarket || !currentMarket.baseAsset || !currentMarket.quoteAsset) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-gray-400">Invalid market data structure</div>
      </div>
    );
  }

  // Get token information for the current market
  const { baseToken, quoteToken } = getMarketTokens(
    currentMarket.baseAsset,
    currentMarket.quoteAsset
  );

  // Check if tokens are available
  if (!baseToken || !quoteToken) {
    const fallbackBaseDecimals = baseToken?.decimals || 18;
    const fallbackQuoteDecimals = quoteToken?.decimals || 6;

    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col">
        {/* Header with market info and 24h stats - all in one line */}
        <div className="mb-4 flex items-center gap-6 text-sm">
          <h1 className="text-xl font-semibold text-white">
            {currentMarket.baseAsset}/{currentMarket.quoteAsset}
          </h1>
          <div className="text-lg font-medium text-white">
            ${ticker24hr ? (parseFloat(ticker24hr.lastPrice) / 1e6).toFixed(2) : (parseFloat(currentMarket.latestPrice) / Math.pow(10, currentMarket.quoteDecimals)).toFixed(2)}
          </div>

          {/* 24h Statistics */}
          <div className="flex flex-col">
            <span className="text-gray-400">24H Change</span>
            <span className={`font-medium ${ticker24hr && parseFloat(ticker24hr.priceChangePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {ticker24hr
                ? `${parseFloat(ticker24hr.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(ticker24hr.priceChangePercent).toFixed(2)}%`
                : '--'
              }
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-400">24H High</span>
            <span className="text-white font-medium">
              {ticker24hr
                ? `$${(parseFloat(ticker24hr.highPrice) / 1e6).toFixed(2)}`
                : '--'
              }
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-400">24H Low</span>
            <span className="text-white font-medium">
              {ticker24hr
                ? `$${(parseFloat(ticker24hr.lowPrice) / 1e6).toFixed(2)}`
                : '--'
              }
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-400">24H Volume</span>
            <span className="text-white font-medium">
              {ticker24hr
                ? parseFloat(ticker24hr.volume).toLocaleString(undefined, { maximumFractionDigits: 2 })
                : parseFloat(currentMarket.volume) === 0
                  ? '0'
                  : (parseFloat(currentMarket.volume) / Math.pow(10, currentMarket.baseDecimals)).toLocaleString()
              }
            </span>
          </div>
        </div>

        {/* Continue with the trading interface using fallback values */}
        <div className="grid grid-cols-[minmax(0,1fr)_340px_380px] gap-4 h-fit">
          <Chart symbol={symbol} />
          <OrderBook symbol={symbol} />
          <PlaceOrder
            baseToken={baseToken || {
              address: '',
              symbol: currentMarket.baseAsset,
              decimals: 18 // Default fallback
            }}
            quoteToken={quoteToken || {
              address: '',
              symbol: currentMarket.quoteAsset,
              decimals: 6 // Default fallback
            }}
          />
        </div>

        <History symbol={symbol} baseDecimals={fallbackBaseDecimals} quoteDecimals={fallbackQuoteDecimals} />
      </div>
    );
  }



  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col">
      {/* Header with market info and 24h stats - all in one line */}
      <div className="mb-4 flex items-center gap-6 text-sm">
        <h1 className="text-xl font-semibold text-white">
          {currentMarket.baseAsset}/{currentMarket.quoteAsset}
        </h1>
        <div className="text-lg font-medium text-white">
          ${ticker24hr ? (parseFloat(ticker24hr.lastPrice) / 1e6).toFixed(2) : (parseFloat(currentMarket.latestPrice) / Math.pow(10, currentMarket.quoteDecimals)).toFixed(2)}
        </div>

        {/* 24h Statistics */}
        <div className="flex flex-col">
          <span className="text-gray-400">24H Change</span>
          <span className={`font-medium ${ticker24hr && parseFloat(ticker24hr.priceChangePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {ticker24hr
              ? `${parseFloat(ticker24hr.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(ticker24hr.priceChangePercent).toFixed(2)}%`
              : '--'
            }
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-400">24H High</span>
          <span className="text-white font-medium">
            {ticker24hr
              ? `$${(parseFloat(ticker24hr.highPrice) / 1e6).toFixed(2)}`
              : '--'
            }
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-400">24H Low</span>
          <span className="text-white font-medium">
            {ticker24hr
              ? `$${(parseFloat(ticker24hr.lowPrice) / 1e6).toFixed(2)}`
              : '--'
            }
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-400">24H Volume</span>
          <span className="text-white font-medium">
            {ticker24hr
              ? parseFloat(ticker24hr.volume).toLocaleString(undefined, { maximumFractionDigits: 2 })
              : parseFloat(currentMarket.volume) === 0
                ? '0'
                : (parseFloat(currentMarket.volume) / Math.pow(10, currentMarket.baseDecimals)).toLocaleString()
            }
          </span>
        </div>
      </div>

      {/* Main trading interface */}
      <div className="grid grid-cols-[minmax(0,1fr)_220px_320px] gap-4 h-fit">
        <Chart symbol={symbol} />
        <OrderBook symbol={symbol} />
        <PlaceOrder
          baseToken={{
            address: baseToken.address,
            symbol: baseToken.symbol,
            decimals: baseToken.decimals
          }}
          quoteToken={{
            address: quoteToken.address,
            symbol: quoteToken.symbol,
            decimals: quoteToken.decimals
          }}
        />
      </div>

      <History symbol={symbol} baseDecimals={baseToken.decimals} quoteDecimals={quoteToken.decimals} />
    </div>
  );
}

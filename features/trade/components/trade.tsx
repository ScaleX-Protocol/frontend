'use client';

import { useState, useEffect } from 'react';
import { useMarkets } from '../hooks/chart/useMarkets';
import type { Market } from '../types/chart.types';
import { findDefaultMarket } from '../utils/defaultMarket';
import Chart from './chart/chart';
import History from './history/history';
import OrderBook from './orderBook/orderBook';
import PlaceOrder from './placeOrder/placeOrder';
import { useTokenLookupUtils } from '../hooks/token/useTokenLookup';

export default function Trade() {
  const { data, isLoading, error, refetch } = useMarkets();
  const { getMarketTokens, isLoading: tokensLoading, getAllSymbols } = useTokenLookupUtils();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  // Set default market when data loads
  useEffect(() => {
    if (data && data.length > 0 && !selectedMarket) {
      const defaultMarket = findDefaultMarket(data);
      setSelectedMarket(defaultMarket);
    }
  }, [data, selectedMarket]);

  if (isLoading) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-gray-400">Loading markets...</div>
      </div>
    );
  }

  if (error) {
    console.log('error market data');
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

  // Initialize selected market if not set
  const currentMarket = selectedMarket || findDefaultMarket(data);

  if (!currentMarket || !currentMarket.baseAsset || !currentMarket.quoteAsset) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-gray-400">Invalid market data structure</div>
      </div>
    );
  }

  const symbol = `${currentMarket.baseAsset}/${currentMarket.quoteAsset}`;

  // Get token information for the current market
  const { baseToken, quoteToken } = getMarketTokens(
    currentMarket.baseAsset,
    currentMarket.quoteAsset
  );

  // Check if tokens are available
  if (!baseToken || !quoteToken) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col">
        {/* Continue with the trading interface using fallback values */}
        <div className="grid grid-cols-[minmax(0,1fr)_300px_300px] gap-4 h-fit">
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

        <History symbol={symbol} />
      </div>
    );
  }



  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col">
      {/* Header with market info */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">
            {currentMarket.baseAsset}/{currentMarket.quoteAsset}
          </h1>
          <div className="text-sm text-gray-400">
            ${(parseFloat(currentMarket.latestPrice) / Math.pow(10, currentMarket.quoteDecimals)).toFixed(2)}
          </div>
        </div>
        
        {/* Market stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-gray-400">24h Volume</span>
            <span className="text-white font-medium">
              {parseFloat(currentMarket.volume) === 0 
                ? '0' 
                : (parseFloat(currentMarket.volume) / Math.pow(10, currentMarket.baseDecimals)).toLocaleString()
              } {currentMarket.baseAsset}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-400">Liquidity</span>
            <span className="text-white font-medium">
              ${parseFloat(currentMarket.totalLiquidityInQuote) === 0 
                ? '0' 
                : (parseFloat(currentMarket.totalLiquidityInQuote) / Math.pow(10, currentMarket.quoteDecimals + 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
              }
            </span>
          </div>
        </div>
      </div>

      {/* Main trading interface */}
      <div className="grid grid-cols-[minmax(0,1fr)_300px_300px] gap-4 h-fit">
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
      
      <History symbol={symbol} />
    </div>
  );
}

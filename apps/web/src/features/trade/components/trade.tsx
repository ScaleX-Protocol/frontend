'use client';

import { useState } from 'react';
import { useTicker24hr, useTokenLookupUtils } from '@scalex/service-trading';
import Chart from './chart/chart';
import History from './history/history';
import OrderBook from './orderBook/orderBook';
import PlaceOrder from './placeOrder/placeOrder';
import { MarketSelectorModal } from './marketSelector/marketSelectorModal';
import { useMarketSelector } from '../hooks/useMarketSelector';
import { logger } from '@/utils/prodLogger';

interface TradeProps {
  pairId?: string;
}

export default function Trade({ pairId }: TradeProps) {
  const log = logger.withContext({ component: 'Trade' });
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);

  const {
    filteredMarkets,
    selectedMarket,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    favorites,
    toggleFavorite,
    selectMarket,
  } = useMarketSelector({ pairId });

  const { getMarketTokens } = useTokenLookupUtils();

  // Calculate symbol for ticker data
  const symbol = selectedMarket 
    ? `${selectedMarket.baseAsset}/${selectedMarket.quoteAsset}` 
    : '';

  // Fetch 24hr ticker data 
  const { data: ticker24hr } = useTicker24hr(symbol, {
    enabled: !!symbol && !!selectedMarket,
  });

  // Handle opening market selector
  const handleMarketClick = () => {
    setIsMarketSelectorOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full flex-1 p-4 flex items-center justify-center">
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
    return (
      <div className="w-full flex-1 p-4 flex items-center justify-center">
        <div className="text-red-400">Error loading market data</div>
      </div>
    );
  }

  // No selected market
  if (!selectedMarket) {
    return (
      <div className="w-full flex-1 p-4 flex items-center justify-center">
        <div className="text-[#A0A0A0]">No market data available</div>
      </div>
    );
  }

  // Get token information for the current market
  const { baseToken, quoteToken } = getMarketTokens(
    selectedMarket.baseAsset,
    selectedMarket.quoteAsset
  );

  const baseDecimals = baseToken?.decimals || 18;
  const quoteDecimals = quoteToken?.decimals || 6;
  
  // Format price
  const currentPrice = ticker24hr 
    ? (parseFloat(ticker24hr.lastPrice) / Math.pow(10, quoteDecimals)).toFixed(2)
    : (parseFloat(selectedMarket.latestPrice) / Math.pow(10, quoteDecimals)).toFixed(2);
  
  // Format 24h stats
  const priceChange = ticker24hr ? parseFloat(ticker24hr.priceChangePercent) : 0;
  const highPrice = ticker24hr 
    ? (parseFloat(ticker24hr.highPrice) / Math.pow(10, quoteDecimals)).toFixed(2)
    : '--';
  const lowPrice = ticker24hr
    ? (parseFloat(ticker24hr.lowPrice) / Math.pow(10, quoteDecimals)).toFixed(2)
    : '--';
  // Always use selectedMarket.volumeInQuote from /markets API as it has reliable data
  const volume = (parseFloat(selectedMarket.volumeInQuote || '0') / Math.pow(10, quoteDecimals)).toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <>
      <div className="w-full flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        {/* Desktop Layout: 2 columns - Chart left, PlaceOrder+OrderBook right */}
        {/* Mobile Layout: Vertical stack */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
          {/* Left Column - Chart & History */}
          <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-4">
            <Chart 
              symbol={symbol}
              currentPrice={currentPrice}
              priceChange={priceChange}
              highPrice={highPrice}
              lowPrice={lowPrice}
              volume={volume}
              baseAsset={selectedMarket.baseAsset}
              quoteAsset={selectedMarket.quoteAsset}
              onMarketClick={handleMarketClick}
            />
            <History symbol={symbol} baseDecimals={baseDecimals} quoteDecimals={quoteDecimals} />
          </div>
          
          {/* Right Column - PlaceOrder + OrderBook (desktop) */}
          <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-4">
            {/* Place Order */}
            <div className="lg:h-auto">
              <PlaceOrder
                baseToken={{
                  address: baseToken?.address || '',
                  symbol: baseToken?.symbol || selectedMarket.baseAsset,
                  decimals: baseDecimals
                }}
                quoteToken={{
                  address: quoteToken?.address || '',
                  symbol: quoteToken?.symbol || selectedMarket.quoteAsset,
                  decimals: quoteDecimals
                }}
              />
            </div>
            
            {/* Order Book - Desktop only, below PlaceOrder */}
            <div className="hidden lg:block">
              <OrderBook symbol={symbol} />
            </div>
          </div>
        </div>


      </div>

      {/* Market Selector Modal */}
      <MarketSelectorModal
        isOpen={isMarketSelectorOpen}
        onClose={() => setIsMarketSelectorOpen(false)}
        markets={filteredMarkets}
        selectedMarket={selectedMarket}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onSelectMarket={selectMarket}
      />
    </>
  );
}


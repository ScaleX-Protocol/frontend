'use client';

import { lazy, Suspense, useState } from 'react';
import { useTicker24hr, useTokenLookupUtils } from '@scalex/service-trading';
import { useMarketSelector } from '../hooks/useMarketSelector';
import { useViewMode } from '@/hooks/ui/useViewMode';
import { logger } from '@/utils/prodLogger';

// Lazy load view components for performance
const TradeDesktop = lazy(() => import('./TradeDesktop'));
const TradeMobile = lazy(() => import('./TradeMobile'));

// Loading skeleton while view loads
function ViewLoadingSkeleton() {
  return (
    <div className="w-full flex-1 p-5 md:p-8 flex flex-col gap-6 animate-pulse">
      <div className="h-20 w-full bg-[#1A1A1A] rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="col-span-2 h-[400px] bg-[#1A1A1A] rounded-[16px]" />
        <div className="h-[400px] bg-[#1A1A1A] rounded-[16px]" />
      </div>
    </div>
  );
}

interface TradeProps {
  pairId?: string;
}

export default function Trade({ pairId }: TradeProps) {
  const log = logger.withContext({ component: 'Trade' });
  const viewMode = useViewMode();
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

  // Convert favorites array to Set for consistent API
  const favoritesSet = new Set(favorites);

  // Shared props for both views
  const sharedProps = {
    symbol,
    currentPrice,
    priceChange,
    highPrice,
    lowPrice,
    volume,
    selectedMarket,
    baseToken: baseToken || { address: '', symbol: selectedMarket.baseAsset, decimals: baseDecimals },
    quoteToken: quoteToken || { address: '', symbol: selectedMarket.quoteAsset, decimals: quoteDecimals },
    baseDecimals,
    quoteDecimals,
    onMarketClick: handleMarketClick,
    // Market Selector Props
    isMarketSelectorOpen,
    onCloseMarketSelector: () => setIsMarketSelectorOpen(false),
    filteredMarkets,
    searchQuery,
    onSearchChange: setSearchQuery,
    activeTab,
    onTabChange: setActiveTab,
    favorites: favoritesSet,
    onToggleFavorite: toggleFavorite,
    onSelectMarket: selectMarket,
  };

  // Render appropriate view based on viewport
  return (
    <Suspense fallback={<ViewLoadingSkeleton />}>
      {viewMode === 'mobile' ? (
        <TradeMobile {...sharedProps} />
      ) : (
        <TradeDesktop {...sharedProps} />
      )}
    </Suspense>
  );
}

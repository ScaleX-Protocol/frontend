'use client';

import { lazy, Suspense, useState, useCallback } from 'react';
import { ServerCrash, LineChart, Search } from 'lucide-react';
import { useTokenLookupUtils } from '@scalex/service-trading';
import { useTicker24hr } from '@scalex/api';
import { useQueryClient } from '@tanstack/react-query';
import { useMarketSelector } from '../hooks/useMarketSelector';
import { TradeProvider } from '../context/TradeContext';
import { useViewMode } from '@/hooks/ui/useViewMode';
import { logger } from '@/utils/prodLogger';
import { useWalletState } from '@/hooks/useWalletState';

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
  const queryClient = useQueryClient();
  const wallet = useWalletState();
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

  // Refresh callback to refetch all trade-related data after order placement
  const handleDataRefresh = useCallback(() => {
    log.info('Trade data refresh requested after order placement', {
      symbol: selectedMarket ? `${selectedMarket.baseAsset}/${selectedMarket.quoteAsset}` : undefined,
      userAddress: wallet.embeddedWallet.address,
    });

    // Invalidate all trade-related queries to trigger refetch after indexer sync
    if (selectedMarket) {
      const symbol = `${selectedMarket.baseAsset}/${selectedMarket.quoteAsset}`;

      // Invalidate all queries for this symbol
      queryClient.invalidateQueries({ queryKey: ['ticker24hr', symbol] });
      queryClient.invalidateQueries({ queryKey: ['depth', symbol] });
      queryClient.invalidateQueries({ queryKey: ['trades', symbol] });
      queryClient.invalidateQueries({ queryKey: ['kline', symbol] });
      queryClient.invalidateQueries({ queryKey: ['markets'] });

      // Invalidate user-specific queries if wallet is connected
      if (wallet.embeddedWallet.address) {
        queryClient.invalidateQueries({ queryKey: ['openOrders', wallet.embeddedWallet.address] });
        queryClient.invalidateQueries({ queryKey: ['allOrders', wallet.embeddedWallet.address] });
        queryClient.invalidateQueries({ queryKey: ['account', wallet.embeddedWallet.address] });
      }

      log.info('All trade queries invalidated, refetching data');
    }
  }, [queryClient, selectedMarket, wallet.embeddedWallet.address, log]);

  const { getMarketTokens } = useTokenLookupUtils();

  // Calculate symbol for ticker data
  const symbol = selectedMarket
    ? `${selectedMarket.baseAsset}/${selectedMarket.quoteAsset}`
    : '';

  // Fetch 24hr ticker data 
  const { data: ticker24hr } = useTicker24hr(symbol);

  // Get decimals from market data (will be provided via TradeContext)
  const baseDecimals = selectedMarket?.baseDecimals ?? 18;
  const quoteDecimals = selectedMarket?.quoteDecimals ?? 18;

  // Handle opening market selector
  const handleMarketClick = () => {
    setIsMarketSelectorOpen(true);
  };

  // Loading state
  if (isLoading) {
    return <ViewLoadingSkeleton />;
  }

  // Error state
  if (error) {
    log.error('Error loading market data', error);
    return (
      <div className="w-full flex-1 p-4 md:p-8 flex items-center justify-center relative">
        <div className="flex flex-col items-center gap-6 w-full max-w-[420px] text-center bg-[#111111] p-8 md:p-10 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
          {/* Decorative background gradients */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#F06718]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#F06718]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-[#F06718] relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
            <ServerCrash className="w-10 h-10" strokeWidth={1.5} />
          </div>

          <div className="space-y-3 relative z-10">
            <h3 className="text-2xl font-semibold text-white tracking-tight">System Maintenance</h3>
            <p className="text-[#888888] leading-relaxed text-[15px]">
              Our trading engines are currently undergoing scheduled optimizations to enhance market depth and speed. Normal operations will resume shortly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-4 relative z-10">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3.5 px-4 bg-[#F06718] hover:bg-[#D55A15] text-white rounded-xl transition-all font-medium text-[15px] shadow-lg shadow-[#F06718]/10 hover:shadow-[#F06718]/25"
            >
              Check Status
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 py-3.5 px-4 bg-[#1A1A1A] hover:bg-[#252525] text-white rounded-xl transition-all border border-white/5 font-medium text-[15px]"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No selected market
  if (!selectedMarket) {
    return (
      <div className="w-full flex-1 p-4 md:p-8 flex items-center justify-center relative">
        <div className="flex flex-col items-center gap-6 w-full max-w-[420px] text-center bg-[#111111] p-8 md:p-10 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
          {/* Decorative background gradients */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#F06718]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-[#A0A0A0] relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
            <LineChart className="w-10 h-10 opacity-70" strokeWidth={1.5} />
          </div>

          <div className="space-y-3 relative z-10">
            <h3 className="text-2xl font-semibold text-white tracking-tight">No Market Selected</h3>
            <p className="text-[#888888] leading-relaxed text-[15px]">
              Select a trading pair to access real-time charts, order book depth, and execute your trades instantly.
            </p>
          </div>

          <div className="w-full mt-4 relative z-10">
            <button
              onClick={handleMarketClick}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-[#F06718] hover:bg-[#D55A15] text-white rounded-xl transition-all font-medium text-[15px] shadow-lg shadow-[#F06718]/10 hover:shadow-[#F06718]/25"
            >
              <Search className="w-4 h-4" />
              Explore Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get token information for the current market
  const { baseToken, quoteToken } = getMarketTokens(
    selectedMarket.baseAsset,
    selectedMarket.quoteAsset
  );

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
    // Always use market decimals (from /markets API) as they are the source of truth for each trading pair
    baseToken: baseToken ? { ...baseToken, decimals: baseDecimals } : { address: '', symbol: selectedMarket.baseAsset, decimals: baseDecimals },
    quoteToken: quoteToken ? { ...quoteToken, decimals: quoteDecimals } : { address: '', symbol: selectedMarket.quoteAsset, decimals: quoteDecimals },
    baseDecimals,
    quoteDecimals,
    onMarketClick: handleMarketClick,
    onDataRefresh: handleDataRefresh,
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
    <TradeProvider selectedMarket={selectedMarket}>
      <Suspense fallback={<ViewLoadingSkeleton />}>
        {viewMode === 'mobile' ? (
          <TradeMobile {...sharedProps} />
        ) : (
          <TradeDesktop {...sharedProps} />
        )}
      </Suspense>
    </TradeProvider>
  );
}

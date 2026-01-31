'use client';

import { ChevronDown, TrendingUp, TrendingDown, XCircle } from 'lucide-react';
import { TokenIcon } from '@/components/common/TokenIcon';
import Chart from './chart/chart';
import History from './history/history';
import PlaceOrder from './placeOrder/placeOrder';
import { MarketSelectorModal } from './marketSelector/marketSelectorModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useWebSocket } from '@/providers/websocketProvider';
import type { Market } from '@scalex/types';

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface TradeMobileProps {
  symbol: string;
  currentPrice: string;
  priceChange: number;
  highPrice: string;
  lowPrice: string;
  volume: string;
  selectedMarket: Market;
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  baseDecimals: number;
  quoteDecimals: number;
  onMarketClick: () => void;
  onDataRefresh?: () => void;
  // Market Selector Props
  isMarketSelectorOpen: boolean;
  onCloseMarketSelector: () => void;
  filteredMarkets: Market[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  favorites: Set<string>;
  onToggleFavorite: (marketId: string) => void;
  onSelectMarket: (market: Market) => void;
}

export default function TradeMobile({
  symbol,
  currentPrice,
  priceChange,
  highPrice,
  lowPrice,
  volume,
  onDataRefresh,
  selectedMarket,
  baseToken,
  quoteToken,
  baseDecimals,
  quoteDecimals,
  onMarketClick,
  isMarketSelectorOpen,
  onCloseMarketSelector,
  filteredMarkets,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  favorites,
  onToggleFavorite,
  onSelectMarket,
}: TradeMobileProps) {
  const isPositiveChange = priceChange >= 0;
  const { lastError, clearError, connectionState } = useWebSocket();

  return (
    <>
      {/* WebSocket Error Alert - For Debugging */}
      {lastError && (
        <div className="fixed top-0 left-0 right-0 z-50 p-3 bg-red-900/95 border-b border-red-500">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 overflow-auto">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 font-bold text-xs">⚠️ WebSocket Error</span>
                <span className="text-red-300/70 text-[10px]">State: {connectionState}</span>
              </div>
              <p className="text-red-200 text-[10px] break-all whitespace-pre-wrap">
                {lastError}
              </p>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="p-1 hover:bg-red-700 rounded"
            >
              <XCircle className="w-4 h-4 text-red-300" />
            </button>
          </div>
        </div>
      )}
      
      <div className="w-full flex-1 flex flex-col gap-3 pb-20">
        {/* Mobile Header - Price and Market Pair */}
        <div className='flex flex-col gap-4 p-5 pb-2 justify-center items-center'>
          {/* Market Pair Badge */}
          <button
            type="button"
            onClick={onMarketClick}
            className="flex items-center w-fit gap-2 px-3 py-1.5 bg-[#111111] rounded-full border border-[#222222]"
          >
            <div className="flex items-center -space-x-1.5">
              <div className="z-10">
                <TokenIcon symbol={selectedMarket.baseAsset} size="xs" />
              </div>
              <div className="z-0">
                <TokenIcon symbol={selectedMarket.quoteAsset} size="xs" />
              </div>
            </div>
            <span className="text-white text-xs leading-[16px] font-medium">
              {selectedMarket.baseAsset} / {selectedMarket.quoteAsset}
            </span>
            <ChevronDown className="w-3 h-3 text-[#666666]" />
          </button>

          {/* Price Display */}
          <div className='flex flex-col items-center justify-center'>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-[36px] leading-[40px] font-semibold">
                ${currentPrice}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${isPositiveChange ? 'bg-[#2ECC71]/10' : 'bg-[#EF4444]/10'}`}>
                {isPositiveChange ? (
                  <TrendingUp className="w-3 h-3 text-[#2ECC71]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[#EF4444]" />
                )}
                <span className={`text-xs leading-[16px] font-medium ${isPositiveChange ? 'text-[#2ECC71]' : 'text-[#EF4444]'}`}>
                  {priceChange.toFixed(2)}%
                </span>
              </div>
              <span className="text-[#666666] text-xs leading-[16px]">
                {isPositiveChange ? '+' : '-'} ${(parseFloat(currentPrice.replace(/,/g, '')) * priceChange / 100).toFixed(2)} (24h)
              </span>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="flex w-full justify-center items-center gap-2">
            <div className="flex flex-col bg-[#0A0A0A] rounded-[8px] px-3 py-1.5 border border-[#1F1F1F]">
              <span className="text-[#666666] text-[10px] leading-[15px] tracking-[0.5px]">24H HIGH</span>
              <span className="text-white text-xs leading-[16px] font-medium">${highPrice}</span>
            </div>
            <div className="flex flex-col bg-[#0A0A0A] rounded-[8px] px-3 py-1.5 border border-[#1F1F1F]">
              <span className="text-[#666666] text-[10px] leading-[15px] tracking-[0.5px]">24H LOW</span>
              <span className="text-white text-xs leading-[16px] font-medium">${lowPrice}</span>
            </div>
            <div className="flex flex-col bg-[#0A0A0A] rounded-[8px] px-3 py-1.5 border border-[#1F1F1F]">
              <span className="text-[#666666] text-[10px] leading-[15px] tracking-[0.5px]">VOLUME</span>
              <span className="text-white text-xs leading-[16px] font-medium">${volume}</span>
            </div>
          </div>
        </div>


        {/* Compact Chart */}
        <div className="px-4">
          <div className="bg-[#0A0A0A] rounded-[12px] border border-[#222222] overflow-hidden h-[180px]">
            <ErrorBoundary
              fallback={({ error, reset }) => (
                <div className="flex flex-col p-3 bg-[#1a0a0a] h-full overflow-auto text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-500 font-bold text-sm">⚠️ Chart Error</span>
                    <button 
                      onClick={reset}
                      className="px-2 py-1 bg-orange-600 text-white text-xs rounded"
                    >
                      Retry
                    </button>
                  </div>
                  <div className="text-xs text-red-400 mb-2">
                    <strong>Message:</strong> {error?.message || 'Unknown error'}
                  </div>
                  <div className="text-[10px] text-gray-400 overflow-auto flex-1 whitespace-pre-wrap break-all">
                    <strong>Stack:</strong>
                    <br />
                    {error?.stack || 'No stack trace'}
                  </div>
                </div>
              )}
            >
              <Chart 
                symbol={symbol}
                currentPrice={currentPrice}
                priceChange={priceChange}
                highPrice={highPrice}
                lowPrice={lowPrice}
                volume={volume}
                baseAsset={selectedMarket.baseAsset}
                quoteAsset={selectedMarket.quoteAsset}
                onMarketClick={onMarketClick}
                variant="mobile"
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Place Order with integrated OrderBook for mobile */}
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
          variant="mobile"
          symbol={symbol}
          onDataRefresh={onDataRefresh}
        />

        {/* History Section */}
        <History 
          symbol={symbol} 
          baseDecimals={baseDecimals} 
          quoteDecimals={quoteDecimals}
          variant="mobile" 
        />
      </div>

      {/* Market Selector Modal */}
      <MarketSelectorModal
        isOpen={isMarketSelectorOpen}
        onClose={onCloseMarketSelector}
        markets={filteredMarkets}
        selectedMarket={selectedMarket}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeTab={activeTab as 'all' | 'favorites'}
        onTabChange={onTabChange}
        favorites={Array.from(favorites)}
        onToggleFavorite={onToggleFavorite}
        onSelectMarket={onSelectMarket}
        variant="mobile"
      />
    </>
  );
}

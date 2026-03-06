'use client';

import Chart from './chart/chart';
import ChartErrorBoundary from './chart/ChartErrorBoundary';
import History from './history/history';
import OrderBook from './orderBook/orderBook';
import PlaceOrder from './placeOrder/placeOrder';
import { MarketSelectorModal } from './marketSelector/marketSelectorModal';
import type { Market } from '@scalex/types';
import { InfoPopover } from '@/components/ui/info-popover';

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface TradeDesktopProps {
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

export default function TradeDesktop({
  symbol,
  currentPrice,
  priceChange,
  highPrice,
  lowPrice,
  volume,
  selectedMarket,
  baseToken,
  quoteToken,
  baseDecimals,
  quoteDecimals,
  onMarketClick,
  onDataRefresh,
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
}: TradeDesktopProps) {
  return (
    <>
      <div className="w-full flex-1 p-8 flex flex-col gap-6">
        {/* Desktop Layout: 2 columns - Chart left, PlaceOrder+OrderBook right */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
          {/* Left Column - Chart & History */}
          <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#888888] text-xs">Chart</span>
              <InfoPopover content="Real-time price chart with candlestick data. Use the timeframe selector to switch between intervals." side="right" />
            </div>
            <ChartErrorBoundary variant="desktop">
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
              />
            </ChartErrorBoundary>
            <History symbol={symbol} baseDecimals={baseDecimals} quoteDecimals={quoteDecimals} />
          </div>
          
          {/* Right Column - PlaceOrder + OrderBook (desktop) */}
          <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-4">
            {/* Place Order */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#888888] text-xs">Order Form</span>
              <InfoPopover content="Place market or limit orders. Select buy/sell, enter amount, and set your price for limit orders." side="left" />
            </div>
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
                variant="desktop"
                symbol={symbol}
                onDataRefresh={onDataRefresh}
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
        variant="desktop"
      />
    </>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { TokenIcon } from '@/components/common/TokenIcon';
import Chart from './chart/chart';
import History from './history/history';
import PlaceOrder from './placeOrder/placeOrder';
import { MarketSelectorModal } from './marketSelector/marketSelectorModal';
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

  return (
    <>
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
      />
    </>
  );
}

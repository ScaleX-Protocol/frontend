import { useEffect, useRef } from 'react';
import type { Market } from '@scalex/types';
import { MarketSelectorRow, MarketSelectorCard } from './marketSelectorRow';

interface MarketSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  markets: Market[];
  selectedMarket: Market | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: 'all' | 'favorites';
  onTabChange: (tab: 'all' | 'favorites') => void;
  favorites: string[];
  onToggleFavorite: (poolId: string) => void;
  onSelectMarket: (market: Market) => void;
  variant?: 'desktop' | 'mobile';
}

export function MarketSelectorModal({
  isOpen,
  onClose,
  markets,
  selectedMarket,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  favorites,
  onToggleFavorite,
  onSelectMarket,
  variant = 'desktop',
}: MarketSelectorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMobile = variant === 'mobile';

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectMarket = (market: Market) => {
    onSelectMarket(market);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm ${
        isMobile ? 'items-end' : 'items-center justify-center'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={`bg-[#1A1A1A] flex flex-col overflow-hidden ${
          isMobile 
            ? 'w-full h-[85vh] rounded-t-2xl border-t border-x border-[#3A3A3A]' 
            : 'w-full max-w-4xl max-h-[80vh] rounded-xl border border-[#3A3A3A] shadow-2xl'
        }`}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex items-center justify-center py-2">
            <div className="w-10 h-1 bg-[#3A3A3A] rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className={`flex items-center justify-between border-b border-[#3A3A3A] ${
          isMobile ? 'px-4 py-3' : 'px-6 py-4'
        }`}>
          <h2 className={`font-semibold text-[#E0E0E0] ${isMobile ? 'text-base' : 'text-lg'}`}>
            Spot Markets
          </h2>
          
          {/* Close button - Mobile */}
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Search Input - Desktop */}
          {!isMobile && (
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-48 pl-10 pr-4 py-2 bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg text-sm text-[#E0E0E0] placeholder-[#A0A0A0] focus:outline-none focus:border-[#F06718]"
              />
            </div>
          )}
        </div>

        {/* Search Input - Mobile (full width below header) */}
        {isMobile && (
          <div className="px-4 py-3 border-b border-[#3A3A3A]">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg text-sm text-[#E0E0E0] placeholder-[#A0A0A0] focus:outline-none focus:border-[#F06718]"
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex items-center gap-2 border-b border-[#3A3A3A] ${
          isMobile ? 'px-4 py-2' : 'px-6 py-3'
        }`}>
          <button
            type="button"
            onClick={() => onTabChange('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-[#3A3A3A] text-[#E0E0E0]'
                : 'text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-[#2A2A2A]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onTabChange('favorites')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'favorites'
                ? 'bg-[#3A3A3A] text-[#E0E0E0]'
                : 'text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-[#2A2A2A]'
            }`}
          >
            Favorites
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isMobile ? (
            // Mobile: Card-based layout
            <div className="p-4 space-y-2 mb-8">
              {markets.length === 0 ? (
                <div className="py-12 text-center text-[#A0A0A0]">
                  {activeTab === 'favorites'
                    ? 'No favorite markets yet. Click the star icon to add favorites.'
                    : 'No markets found.'
                  }
                </div>
              ) : (
                markets.map((market) => (
                  <MarketSelectorCard
                    key={market.poolId}
                    market={market}
                    isSelected={selectedMarket?.poolId === market.poolId}
                    isFavorite={favorites.includes(market.poolId)}
                    onSelect={handleSelectMarket}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))
              )}
            </div>
          ) : (
            // Desktop: Table layout
            <table className="w-full">
              <thead className="sticky top-0 bg-[#1A1A1A]">
                <tr className="text-[#A0A0A0] text-xs uppercase">
                  <th className="py-3 px-4 text-left font-medium">Symbol</th>
                  <th className="py-3 px-4 text-left font-medium">Last Price</th>
                  <th className="py-3 px-4 text-left font-medium">24H Change</th>
                  <th className="py-3 px-4 text-right font-medium">
                    <div className="flex items-center justify-end gap-1">
                      Volume
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {markets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#A0A0A0]">
                      {activeTab === 'favorites'
                        ? 'No favorite markets yet. Click the star icon to add favorites.'
                        : 'No markets found.'
                      }
                    </td>
                  </tr>
                ) : (
                  markets.map((market) => (
                    <MarketSelectorRow
                      key={market.poolId}
                      market={market}
                      isSelected={selectedMarket?.poolId === market.poolId}
                      isFavorite={favorites.includes(market.poolId)}
                      onSelect={handleSelectMarket}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end border-t border-[#3A3A3A] ${
          isMobile ? 'px-4 py-2' : 'px-6 py-3'
        }`}>
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live Data
          </div>
        </div>
      </div>
    </div>
  );
}

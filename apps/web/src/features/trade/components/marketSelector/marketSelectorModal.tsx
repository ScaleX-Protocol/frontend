import { useEffect, useRef } from 'react';
import type { Market } from '@scalex/types';
import { MarketSelectorRow } from './marketSelectorRow';

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
}: MarketSelectorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-4xl max-h-[80vh] bg-[#1A1A1A] rounded-xl border border-[#3A3A3A] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3A3A]">
          <h2 className="text-lg font-semibold text-[#E0E0E0]">Spot Markets</h2>
          
          {/* Search Input */}
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
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-[#3A3A3A]">
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

        {/* Table */}
        <div className="flex-1 overflow-auto">
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-[#3A3A3A]">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live Data
          </div>
        </div>
      </div>
    </div>
  );
}

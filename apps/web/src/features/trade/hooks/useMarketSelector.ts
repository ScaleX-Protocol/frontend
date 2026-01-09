import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMarkets } from '@scalex/service-trading';
import type { Market } from '@scalex/types';

const FAVORITES_STORAGE_KEY = 'scalex_favorite_markets';

interface UseMarketSelectorOptions {
  pairId?: string;
}

interface UseMarketSelectorReturn {
  markets: Market[];
  filteredMarkets: Market[];
  selectedMarket: Market | null;
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'all' | 'favorites';
  setActiveTab: (tab: 'all' | 'favorites') => void;
  favorites: string[];
  toggleFavorite: (poolId: string) => void;
  selectMarket: (market: Market) => void;
}

export function useMarketSelector({ pairId }: UseMarketSelectorOptions): UseMarketSelectorReturn {
  const navigate = useNavigate();
  const { data: markets = [], isLoading, error } = useMarkets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Find selected market based on pairId from URL
  const selectedMarket = useMemo(() => {
    if (!markets.length) return null;

    // If pairId is provided, find matching market
    if (pairId) {
      const found = markets.find(m => m.poolId === pairId);
      if (found) return found;
    }

    // Fall back to market with highest volume
    const marketsByVolume = [...markets].sort((a, b) => {
      const volumeA = parseFloat(a.volumeInQuote || '0');
      const volumeB = parseFloat(b.volumeInQuote || '0');
      return volumeB - volumeA;
    });

    return marketsByVolume[0] || null;
  }, [markets, pairId]);

  // Redirect to default market if no pairId and we have a selected market
  useEffect(() => {
    if (!pairId && selectedMarket) {
      navigate({ to: '/trade/$pairId', params: { pairId: selectedMarket.poolId } });
    }
  }, [pairId, selectedMarket, navigate]);

  // Filter markets based on search and tab
  const filteredMarkets = useMemo(() => {
    let result = markets;

    // Filter by favorites if on favorites tab
    if (activeTab === 'favorites') {
      result = result.filter(m => favorites.includes(m.poolId));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.baseAsset.toLowerCase().includes(query) ||
        m.quoteAsset.toLowerCase().includes(query) ||
        m.symbol.toLowerCase().includes(query)
      );
    }

    return result;
  }, [markets, activeTab, favorites, searchQuery]);

  // Toggle favorite
  const toggleFavorite = useCallback((poolId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(poolId)
        ? prev.filter(id => id !== poolId)
        : [...prev, poolId];
      
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // Select market and navigate
  const selectMarket = useCallback((market: Market) => {
    navigate({ to: '/trade/$pairId', params: { pairId: market.poolId } });
  }, [navigate]);

  return {
    markets,
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
  };
}


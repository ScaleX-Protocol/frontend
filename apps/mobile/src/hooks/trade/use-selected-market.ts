import { useState, useCallback } from 'react';

interface UseSelectedMarketReturn {
  selectedMarket: string;
  setSelectedMarket: (market: string) => void;
}

const DEFAULT_MARKET = 'ETH_USDT';
const STORAGE_KEY = 'selected_market';

/**
 * Hook to manage the selected trading market.
 * Uses React state for now (MMKV integration can be added later).
 * Syncs with home screen when market selection changes.
 *
 * @returns {Object} - { selectedMarket, setSelectedMarket }
 */
export function useSelectedMarket(): UseSelectedMarketReturn {
  const [selectedMarket, setSelectedMarketState] = useState<string>(DEFAULT_MARKET);

  const setSelectedMarket = useCallback((market: string) => {
    setSelectedMarketState(market);
    // TODO: Add MMKV storage here when needed:
    // mmkv.set(STORAGE_KEY, market);
  }, []);

  return {
    selectedMarket,
    setSelectedMarket,
  };
}

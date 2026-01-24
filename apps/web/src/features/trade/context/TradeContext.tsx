'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Market } from '@scalex/types';

interface TradeContextValue {
  selectedMarket: Market | null;
  symbol: string;
  baseDecimals: number;
  quoteDecimals: number;
}

const TradeContext = createContext<TradeContextValue | null>(null);

interface TradeProviderProps {
  children: ReactNode;
  selectedMarket: Market | null;
}

export function TradeProvider({ children, selectedMarket }: TradeProviderProps) {
  const value = useMemo(() => {
    const symbol = selectedMarket 
      ? `${selectedMarket.baseAsset}/${selectedMarket.quoteAsset}` 
      : '';
    
    return {
      selectedMarket,
      symbol,
      baseDecimals: selectedMarket?.baseDecimals ?? 18,
      quoteDecimals: selectedMarket?.quoteDecimals ?? 18,
    };
  }, [selectedMarket]);

  return (
    <TradeContext.Provider value={value}>
      {children}
    </TradeContext.Provider>
  );
}

export function useTradeContext() {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTradeContext must be used within a TradeProvider');
  }
  return context;
}

export function useTradeContextSafe() {
  return useContext(TradeContext);
}

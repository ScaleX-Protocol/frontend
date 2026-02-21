/**
 * Chain Type Context
 * Provides chain type state throughout the app
 * Initializes from environment detection
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { detectChainType, type ChainType } from '@/configs/chainType';

interface ChainTypeContextValue {
  chainType: ChainType;
  setChainType: (type: ChainType) => void;
  isEVM: boolean;
  isSolana: boolean;
  toggleChainType: () => void;
}

const ChainTypeContext = createContext<ChainTypeContextValue | undefined>(undefined);

interface ChainTypeProviderProps {
  children: ReactNode;
  defaultChainType?: ChainType;
}

export function ChainTypeProvider({
  children,
  defaultChainType,
}: ChainTypeProviderProps) {
  // Use provided default or detect from environment
  const initialChainType = defaultChainType ?? detectChainType();
  const [chainType, setChainType] = useState<ChainType>(initialChainType);

  const toggleChainType = useCallback(() => {
    setChainType((prev) => (prev === 'evm' ? 'solana' : 'evm'));
  }, []);

  const value: ChainTypeContextValue = {
    chainType,
    setChainType,
    isEVM: chainType === 'evm',
    isSolana: chainType === 'solana',
    toggleChainType,
  };

  return (
    <ChainTypeContext.Provider value={value}>
      {children}
    </ChainTypeContext.Provider>
  );
}

export function useChainType(): ChainTypeContextValue {
  const context = useContext(ChainTypeContext);
  if (!context) {
    throw new Error('useChainType must be used within a ChainTypeProvider');
  }
  return context;
}

// Re-export ChainType for convenience
export type { ChainType } from '@/configs/chainType';

import { useState, useCallback } from 'react';
import { useFaucet, FaucetAddressResponse } from './useFaucet';

export interface UseFaucetAddressOptions {
  chainId?: number;
}

export interface UseFaucetAddressState {
  address: string | null;
  isLoading: boolean;
  error: string | null;
  chainId: number;
  lastFetched: number | null;
}

export function useFaucetAddress(options: UseFaucetAddressOptions = {}) {
  const { chainId = 84532 } = options;
  const { getFaucetAddress } = useFaucet();
  
  const [state, setState] = useState<UseFaucetAddressState>({
    address: null,
    isLoading: false,
    error: null,
    chainId,
    lastFetched: null,
  });

  const fetchAddress = useCallback(async (targetChainId?: number) => {
    const currentChainId = targetChainId ?? chainId;
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      chainId: currentChainId 
    }));

    try {
      const response = await getFaucetAddress(currentChainId);

      if (response.success) {
        setState(prev => ({
          ...prev,
          address: response.faucetAddress || null,
          isLoading: false,
          error: null,
          lastFetched: Date.now(),
        }));
      } else {
        setState(prev => ({
          ...prev,
          address: null,
          isLoading: false,
          error: response.error || 'Failed to fetch faucet address',
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        address: null,
        isLoading: false,
        error: errorMessage,
      }));

      return {
        success: false,
        chainId: currentChainId,
        timestamp: Date.now(),
        error: errorMessage,
      } as FaucetAddressResponse;
    }
  }, [chainId, getFaucetAddress]);

  const refetch = useCallback(() => {
    return fetchAddress();
  }, [fetchAddress]);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      address: null,
      isLoading: false,
      error: null,
      lastFetched: null,
    }));
  }, []);

  // Note: Auto-fetch removed to avoid React Compiler issues
  // Users should manually call fetchAddress() when needed

  return {
    ...state,
    fetchAddress,
    refetch,
    reset,
    isAvailable: !!state.address && !state.error,
    isUnavailable: !state.address && !state.isLoading && !!state.error,
  };
}
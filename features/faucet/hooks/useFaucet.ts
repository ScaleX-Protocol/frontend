'use client';

import { useState } from 'react';
import { fetchAPI } from '@/hooks/fetchAPI';
import type { FaucetAddressResponse, FaucetHistoryResponse, FaucetRequest } from '../types/faucet.types';

export interface FaucetResponse {
  success: boolean;
  message?: string;
  transactionHash?: string;
  amountSent?: string;
  tokenSymbol?: string;
  chainId?: number;
  requestId?: number;
  timestamp?: number;
  error?: string;
}

export function useFaucet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestTokens = async (request: FaucetRequest, chainId: number = 84532): Promise<FaucetResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchAPI<FaucetResponse>(`/faucet/request?chainId=${chainId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request tokens';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getFaucetAddress = async (chainId: number = 84532): Promise<FaucetAddressResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchAPI<FaucetAddressResponse>(`/faucet/address?chainId=${chainId}`);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get faucet address';
      setError(errorMessage);
      return {
        success: false,
        chainId,
        timestamp: Date.now(),
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getFaucetHistory = async (
    address?: string,
    chainId?: number,
    limit: number = 50,
  ): Promise<FaucetHistoryResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (address) params.append('address', address);
      if (chainId) params.append('chainId', chainId.toString());
      params.append('limit', Math.min(limit, 100).toString());

      const response = await fetchAPI<FaucetHistoryResponse>(`/faucet/history?${params.toString()}`);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get faucet history';
      setError(errorMessage);
      return {
        success: false,
        data: [],
        count: 0,
        timestamp: Date.now(),
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestTokens,
    getFaucetAddress,
    getFaucetHistory,
    isLoading,
    error,
  };
}

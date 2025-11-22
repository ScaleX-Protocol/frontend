import { useCallback } from 'react';
import type { FaucetRequest } from '../types/faucet.types';
import { useFaucetAddress } from './useFaucetAddress';
import { useFaucetHistory } from './useFaucetHistory';
import { useFaucetRequest } from './useFaucetRequest';

export interface UseFaucetManagerParams {
  chainId?: number;
  address?: string;
  historyLimit?: number;
}

/**
 * Comprehensive hook that manages all faucet functionality in one place
 * Ideal for components that need full faucet integration
 * Note: Auto-fetch has been removed - use manual fetch methods
 */
export function useFaucetManager(options: UseFaucetManagerParams) {
  const { chainId = 84532, address, historyLimit = 50 } = options;

  // Individual hooks
  const requestHook = useFaucetRequest(chainId);
  const historyHook = useFaucetHistory({
    address,
    chainId,
    limit: historyLimit,
  });
  const addressHook = useFaucetAddress({
    chainId,
  });

  // Combined request function that also refreshes history
  const requestTokens = useCallback(
    async (requestData: FaucetRequest) => {
      const result = await requestHook.request(requestData);

      // Refresh history after successful request
      if (result.success) {
        setTimeout(() => {
          historyHook.refetch();
        }, 1000); // Small delay to ensure transaction is indexed
      }

      return result;
    },
    [requestHook, historyHook],
  );

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([historyHook.refetch(), addressHook.refetch()]);
  }, [historyHook, addressHook]);

  // Reset all state
  const resetAll = useCallback(() => {
    requestHook.reset();
    addressHook.reset();
    // Note: historyHook doesn't have reset method - React Query manages its own state
  }, [requestHook, addressHook]);

  // Check if any operation is loading
  const isAnyLoading = requestHook.isLoading || historyHook.isLoading || addressHook.isLoading;

  // Check if there are any errors
  const hasErrors = !!(requestHook.error || historyHook.error || addressHook.error);

  // Get all errors combined
  const allErrors = [requestHook.error, historyHook.error, addressHook.error].filter(Boolean) as string[];

  return {
    // Request functionality - flattened
    requestTokens, // Enhanced version that refreshes history
    request: requestHook,

    // History functionality
    history: historyHook,

    // Address functionality
    address: addressHook,

    // Global state
    isLoading: isAnyLoading,
    hasErrors,
    errors: allErrors,
    chainId,

    // Global actions
    refreshAll,
    resetAll,

    // Quick access to commonly needed data
    faucetAddress: addressHook.address,
    recentRequests: historyHook.data.slice(0, 10), // Last 10 requests
    completedRequests: historyHook.getCompletedRequests(),
    pendingRequests: historyHook.getPendingRequests(),
    failedRequests: historyHook.getFailedRequests(),

    // Status checks
    isFaucetAvailable: addressHook.isAvailable,
    hasHistory: historyHook.hasData,
    lastRequestSuccess: requestHook.isSuccess,
  };
}

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { fetchIndexer } from '../fetchIndexer';
import type { FaucetHistoryItem } from './useFaucet';

export interface FaucetHistoryResponse {
  success: boolean;
  data: FaucetHistoryItem[];
  count: number;
  timestamp: number;
  error?: string;
}

export interface UseFaucetHistoryOptions {
  address?: string;
  chainId?: number;
  limit?: number;
}

export const useFaucetHistory = (
  options?: UseFaucetHistoryOptions,
  queryOptions?: UseQueryOptions<FaucetHistoryResponse, Error>
) => {
  const { address, chainId, limit = 50 } = options || {};
  
  const queryParams = new URLSearchParams();
  if (address) queryParams.append('address', address);
  if (chainId) queryParams.append('chainId', chainId.toString());
  queryParams.append('limit', Math.min(limit, 100).toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/faucet/history?${queryString}` : '/faucet/history';

  const result = useQuery({
    queryKey: ['faucetHistory', options],
    queryFn: () => fetchIndexer<FaucetHistoryResponse>(endpoint),
    enabled: !!address, // Only fetch if address is provided
    staleTime: 30000, // Consider data fresh for 30 seconds
    ...queryOptions,
  });

  const data = result.data?.data || [];
  const hasData = data.length > 0;

  // Helper methods
  const getCompletedRequests = () => data.filter(item => item.status === 'completed');
  const getPendingRequests = () => data.filter(item => item.status === 'pending');
  const getFailedRequests = () => data.filter(item => item.status === 'failed');
  const getRequestsByToken = (tokenAddress: string) => 
    data.filter(item => item.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());

  return {
    data,
    isLoading: result.isLoading,
    error: result.error?.message || null,
    count: data.length,
    lastFetched: result.dataUpdatedAt || null,
    hasData,
    isEmpty: !hasData && !result.isLoading,
    // React Query methods
    refetch: result.refetch,
    fetchHistory: () => result.refetch(),
    // Helper methods
    getCompletedRequests,
    getPendingRequests,
    getFailedRequests,
    getRequestsByToken,
  };
};
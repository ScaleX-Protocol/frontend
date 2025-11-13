import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { TradesData, TradesParams } from '../../types/orderBook.types';
import { orderBookAPI, orderBookKeys } from './useOrderBook';

/**
 * Hook to fetch recent trades
 * @example
 * const { data, isLoading } = useTrades({
 *   pair: 'ETH/USDC',
 *   limit: 50
 * });
 */
export function useTrades(params: TradesParams, options?: Omit<UseQueryOptions<TradesData[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: orderBookKeys.trades(params),
    queryFn: () => orderBookAPI.fetchTrades(params),
    refetchInterval: 2000, // Refetch every 2 seconds
    staleTime: 1000,
    ...options,
  });
}

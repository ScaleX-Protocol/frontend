import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { OrderBookAPI } from '../../mockAPI/orderBook.mockAPI';
import type { OrderBookData, OrderBookParams, TradesParams } from '../../types/orderBook.types';

// Create a singleton instance
export const orderBookAPI = new OrderBookAPI();

// Query keys factory
export const orderBookKeys = {
  all: ['orderbook'] as const,
  orderbook: (params: OrderBookParams) => [...orderBookKeys.all, 'data', params] as const,
  trades: (params: TradesParams) => [...orderBookKeys.all, 'trades', params] as const,
};

// ============================================
// HOOKS
// ============================================

/**
 * Hook to fetch order book data
 * @example
 * const { data, isLoading } = useOrderBook({
 *   pair: 'ETH/USDC',
 *   precision: 0.01,
 *   pattern: 'bid-ask'
 * });
 */
export function useOrderBook(
  params: OrderBookParams,
  options?: Omit<UseQueryOptions<OrderBookData>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: orderBookKeys.orderbook(params),
    queryFn: () => orderBookAPI.fetchOrderBook(params),
    refetchInterval: 1000, // Refetch every second for live data
    staleTime: 500, // Consider data stale after 500ms
    ...options,
  });
}

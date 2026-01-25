import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useOpenOrders,
  useAllOrders,
  useHistoryTrades,
} from '~/src/hooks/trading';
import type { Order, Trade } from '@scalex/types';

export interface UseOrdersDataParams {
  address?: string;
  symbol?: string;
  enabled?: boolean;
}

export function useOrdersData({
  address,
  symbol,
  enabled = true,
}: UseOrdersDataParams) {
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 20;

  // Open Orders with 5s polling
  const openOrdersQuery = useOpenOrders(
    {
      address: address || '',
      symbol,
      limit,
    },
    {
      enabled: enabled && !!address,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      staleTime: 2000,
    }
  );

  // Order History (All Orders)
  const allOrdersQuery = useAllOrders(
    {
      address: address || '',
      symbol,
      limit: page * limit,
    },
    {
      enabled: enabled && !!address,
      staleTime: 10000,
    }
  );

  // Trade History
  const tradesQuery = useHistoryTrades(
    {
      symbol: symbol || '',
      user: address,
      limit: page * limit,
      orderBy: 'desc',
    },
    {
      enabled: enabled && !!symbol,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      staleTime: 2000,
    }
  );

  // Load more function
  const loadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  // Refetch all data
  const refetch = useCallback(() => {
    openOrdersQuery.refetch();
    allOrdersQuery.refetch();
    tradesQuery.refetch();
  }, [openOrdersQuery, allOrdersQuery, tradesQuery]);

  // Calculate loading state
  const isLoading = openOrdersQuery.isLoading || allOrdersQuery.isLoading || tradesQuery.isLoading;

  // Calculate if there's more data to load
  const hasMoreOrders = allOrdersQuery.data && allOrdersQuery.data.length >= page * limit;
  const hasMoreTrades = tradesQuery.data && tradesQuery.data.length >= page * limit;

  return {
    // Data
    openOrders: openOrdersQuery.data || [],
    orderHistory: allOrdersQuery.data || [],
    trades: tradesQuery.data || [],

    // Loading states
    isLoading,
    isLoadingOpenOrders: openOrdersQuery.isLoading,
    isLoadingOrderHistory: allOrdersQuery.isLoading,
    isLoadingTrades: tradesQuery.isLoading,
    isRefetching: openOrdersQuery.isRefetching || allOrdersQuery.isRefetching || tradesQuery.isRefetching,

    // Pagination
    page,
    limit,
    loadMore,
    hasMoreOrders,
    hasMoreTrades,

    // Refetch
    refetch,

    // Errors
    openOrdersError: openOrdersQuery.error,
    orderHistoryError: allOrdersQuery.error,
    tradesError: tradesQuery.error,
  };
}

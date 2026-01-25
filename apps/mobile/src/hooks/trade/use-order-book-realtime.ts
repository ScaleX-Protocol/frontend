import { useEffect, useRef, useCallback } from 'react';
import { useOrderBookDepth, useOrderBookTrades } from '~/src/hooks/trading';
import type { DepthResponse, Trade } from '@scalex/types';

export interface OrderBookData {
  bids: [string, string][];
  asks: [string, string][];
  trades: Trade[];
  isLoading: boolean;
  refetch: () => void;
}

export interface UseOrderBookRealtimeParams {
  symbol: string;
  enabled?: boolean;
  limit?: number;
}

export function useOrderBookRealtime({
  symbol,
  enabled = true,
  limit = 15,
}: UseOrderBookRealtimeParams): OrderBookData {
  // Order book depth data
  const {
    data: depthData,
    isLoading: isDepthLoading,
    refetch: refetchDepth,
  } = useOrderBookDepth(
    { symbol, limit },
    {
      enabled,
      refetchInterval: 500,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      structuralSharing: false,
    }
  );

  // Recent trades data
  const {
    data: tradesData = [],
    isLoading: isTradesLoading,
    refetch: refetchTrades,
  } = useOrderBookTrades(
    { symbol, limit: 50, orderBy: 'desc' },
    {
      enabled,
      refetchInterval: 500,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      structuralSharing: false,
    }
  );

  const hasMounted = useRef(false);

  // Track mounted state to avoid unnecessary refetches on initial mount
  useEffect(() => {
    hasMounted.current = true;
    return () => {
      hasMounted.current = false;
    };
  }, []);

  // Combined refetch function
  const refetch = useCallback(() => {
    if (hasMounted.current && enabled) {
      refetchDepth();
      refetchTrades();
    }
  }, [enabled, refetchDepth, refetchTrades]);

  // Process order book data
  const bids = depthData?.bids.slice(0, limit) || [];
  const asks = depthData?.asks.slice(0, limit) || [];

  return {
    bids,
    asks: asks.reverse(), // Reverse asks to show highest at top
    trades: tradesData,
    isLoading: isDepthLoading || isTradesLoading,
    refetch,
  };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import { useWebSocket } from '@/providers/websocketProvider';
import type { OrderData, UseUserOrdersParams, UseUserOrdersReturn } from './types';
import { logger } from '@/utils/logger';

interface OrderResponse {
  symbol: string;
  orderId: string;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cumulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

// Backend execution report format (Binance-style)
interface ExecutionReportMessage {
  e: 'executionReport';
  E: number;
  s: string;  // symbol
  c: string;  // clientOrderId
  S: string;  // side
  o: string;  // order type
  q: string;  // quantity
  p: string;  // price
  x: string;  // execution type (NEW, TRADE, CANCELED, etc.)
  X: string;  // order status
  i: string;  // orderId
  l: string;  // last executed quantity
  z: string;  // cumulative filled quantity
  L: string;  // last executed price
  n: string;  // commission
  T: number;  // transaction time
  w: boolean; // isWorking
}

/**
 * Hook that combines REST API fetching with WebSocket subscriptions for user's open orders.
 * Provides initial data loading from /api/openOrders and real-time updates via execution reports.
 *
 * @param params - Configuration parameters
 * @param params.address - User's wallet address
 * @param params.symbol - Filter by trading pair symbol (optional)
 * @param params.limit - Maximum number of orders to fetch (default: 100)
 * @param params.enableRealtime - Whether to enable WebSocket updates (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading, openOrderCount, isConnected } = useUserOrders({
 *   address: '0x123...',
 *   symbol: 'BTCUSDT',
 *   enableRealtime: true
 * });
 * ```
 */
export function useUserOrders(params: UseUserOrdersParams): UseUserOrdersReturn {
  const { address, symbol, limit = 100, enableRealtime = true } = params;
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isRealtime, setIsRealtime] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const { socket, connectionState, sendMessage } = useWebSocket();
  const queryClient = useQueryClient();
  const isConnected = connectionState === 'open';

  // Initial orders data fetch via REST API
  const {
    data: initialData,
    isLoading,
    error,
    refetch
  } = useQuery<OrderResponse[], Error>({
    queryKey: ['userOrders', address, symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (address) searchParams.set('address', address);
      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));
      const query = searchParams.toString();
      return fetchIndexerAPI<OrderResponse[]>(`/openOrders?${query}`);
    },
    enabled: !!address,
    refetchInterval: enableRealtime ? false : 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
  });

  // Set initial orders from REST response
  useEffect(() => {
    if (initialData && orders.length === 0) {
      const normalizedOrders: OrderData[] = initialData.map(order => ({
        ...order,
        isRealtime: false
      }));
      setOrders(normalizedOrders);
      setLastUpdate(Date.now());
    }
  }, [initialData, orders.length]);

  // Reset orders when address changes
  useEffect(() => {
    setOrders([]);
    setIsRealtime(false);
  }, [address]);

  // WebSocket subscription for real-time order updates
  useEffect(() => {
    if (!socket || !address || !enableRealtime || !isConnected) {
      return;
    }

    logger.info(`[UserOrders] Setting up real-time updates for ${address.slice(0, 10)}...`);

    // Subscribe to user orders stream
    const subscriptionMessage = {
      id: Date.now() + Math.random(),
      method: 'SUBSCRIBE',
      params: ['user@orders']
    };
    sendMessage(subscriptionMessage);

    // Handle incoming messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        // Handle Binance-style execution report
        if (message.e === 'executionReport') {
          const report = message as ExecutionReportMessage;

          // Filter by symbol if specified
          if (symbol && report.s !== symbol.toUpperCase()) return;

          setOrders(prev => {
            const existingIndex = prev.findIndex(o => o.orderId === report.i);

            if (existingIndex >= 0) {
              // Update existing order
              const updatedOrders = [...prev];
              updatedOrders[existingIndex] = {
                ...updatedOrders[existingIndex],
                status: report.X,
                executedQty: report.z,
                cumulativeQuoteQty: report.z,
                updateTime: report.T,
                isRealtime: true
              };

              // Remove order if it's no longer open
              const openStatuses = ['NEW', 'PARTIALLY_FILLED'];
              if (!openStatuses.includes(report.X)) {
                return updatedOrders.filter(o => o.orderId !== report.i);
              }

              return updatedOrders;
            }

            // If this is a new order, add it
            if (report.X === 'NEW') {
              const newOrder: OrderData = {
                symbol: report.s,
                orderId: report.i,
                orderListId: -1,
                clientOrderId: report.c,
                price: report.p,
                origQty: report.q,
                executedQty: report.z,
                cumulativeQuoteQty: report.z,
                status: report.X,
                timeInForce: 'GTC',
                type: report.o,
                side: report.S,
                stopPrice: '0',
                icebergQty: '0',
                time: report.T,
                updateTime: report.T,
                isWorking: report.w,
                origQuoteOrderQty: '0',
                isRealtime: true
              };
              return [newOrder, ...prev];
            }

            return prev;
          });

          setLastUpdate(Date.now());
          setIsRealtime(true);

          logger.debug(`[UserOrders] Execution report received`, {
            orderId: report.i,
            status: report.X,
            symbol: report.s
          });
        }
      } catch (err) {
        logger.error('Failed to parse order WebSocket message', { error: err });
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);

      // Unsubscribe from order updates
      const unsubscribeMessage = {
        id: Date.now(),
        method: 'UNSUBSCRIBE',
        params: ['user@orders']
      };
      sendMessage(unsubscribeMessage);

      logger.info(`[UserOrders] Cleaning up real-time updates for ${address.slice(0, 10)}...`);
    };
  }, [socket, address, symbol, enableRealtime, isConnected, sendMessage, queryClient]);

  // Calculate derived values
  const openOrderCount = useMemo(() => {
    return orders.filter(o => ['NEW', 'PARTIALLY_FILLED'].includes(o.status)).length;
  }, [orders]);

  const realtimeCount = useMemo(() => {
    return orders.filter(o => o.isRealtime).length;
  }, [orders]);

  const refresh = useCallback(() => {
    setOrders([]);
    setIsRealtime(false);
    refetch();
  }, [refetch]);

  return {
    data: orders.length > 0 ? orders : null,
    isLoading,
    error,
    refresh,
    isConnected: isConnected && enableRealtime,
    isRealtime,
    lastUpdate,
    openOrderCount,
    realtimeCount
  };
}

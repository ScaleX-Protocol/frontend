import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import { useWebSocket } from '@/providers/websocketProvider';
import type { OrderData, UseOrderHistoryParams, UseOrderHistoryReturn } from './types';
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

interface OrderUpdateWsMessage {
  type: 'order_update';
  data: {
    orderId: string;
    symbol: string;
    status: string;
    executedQty: string;
    cumulativeQuoteQty: string;
    updateTime: number;
    price?: string;
    origQty?: string;
    side?: string;
    type?: string;
  };
}

/**
 * Hook that combines REST API fetching with WebSocket subscriptions for user's order history.
 * Provides initial data loading from /api/allOrders and real-time updates via order update events.
 *
 * @param params - Configuration parameters
 * @param params.address - User's wallet address
 * @param params.symbol - Filter by trading pair symbol (optional)
 * @param params.limit - Maximum number of orders to fetch (default: 500)
 * @param params.enableRealtime - Whether to enable WebSocket updates (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading, totalOrders, isConnected } = useOrderHistory({
 *   address: '0x123...',
 *   symbol: 'BTCUSDT',
 *   enableRealtime: true
 * });
 * ```
 */
export function useOrderHistory(params: UseOrderHistoryParams): UseOrderHistoryReturn {
  const { address, symbol, limit = 500, enableRealtime = true } = params;
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isRealtime, setIsRealtime] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const { socket, connectionState, sendMessage } = useWebSocket();
  const isConnected = connectionState === 'open';

  // Initial orders data fetch via REST API
  const {
    data: initialData,
    isLoading,
    error,
    refetch
  } = useQuery<OrderResponse[], Error>({
    queryKey: ['orderHistory', address, symbol, limit] as const,
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (address) searchParams.set('address', address);
      if (symbol) searchParams.set('symbol', symbol);
      if (limit) searchParams.set('limit', String(limit));
      const query = searchParams.toString();
      return fetchIndexerAPI<OrderResponse[]>(`/allOrders?${query}`);
    },
    enabled: !!address,
    refetchInterval: enableRealtime ? false : 10000,
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

    logger.info(`[OrderHistory] Setting up real-time updates for ${address.slice(0, 10)}...`);

    // Subscribe to order updates for this user
    const subscriptionMessage = {
      id: Date.now() + Math.random(),
      method: 'SUBSCRIBE',
      params: [`${address.toLowerCase()}@orders`]
    };
    sendMessage(subscriptionMessage);

    // Handle incoming messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'order_update') {
          const update = message.data as OrderUpdateWsMessage['data'];

          // Filter by symbol if specified
          if (symbol && update.symbol !== symbol) return;

          setOrders(prev => {
            const existingIndex = prev.findIndex(o => o.orderId === update.orderId);

            if (existingIndex >= 0) {
              // Update existing order
              const updatedOrders = [...prev];
              updatedOrders[existingIndex] = {
                ...updatedOrders[existingIndex],
                status: update.status,
                executedQty: update.executedQty,
                cumulativeQuoteQty: update.cumulativeQuoteQty,
                updateTime: update.updateTime,
                isRealtime: true
              };
              return updatedOrders;
            } else {
              // Add new order to history (at the beginning for most recent)
              const newOrder: OrderData = {
                symbol: update.symbol,
                orderId: update.orderId,
                orderListId: -1,
                clientOrderId: '',
                price: update.price || '0',
                origQty: update.origQty || '0',
                executedQty: update.executedQty,
                cumulativeQuoteQty: update.cumulativeQuoteQty,
                status: update.status,
                timeInForce: 'GTC',
                type: update.type || 'LIMIT',
                side: update.side || 'BUY',
                stopPrice: '0',
                icebergQty: '0',
                time: update.updateTime,
                updateTime: update.updateTime,
                isWorking: update.status === 'NEW',
                origQuoteOrderQty: '0',
                isRealtime: true
              };

              return [newOrder, ...prev].slice(0, limit);
            }
          });

          setLastUpdate(Date.now());
          setIsRealtime(true);

          logger.debug(`[OrderHistory] Order update received`, {
            orderId: update.orderId,
            status: update.status,
            symbol: update.symbol
          });
        }
      } catch (err) {
        logger.error('Failed to parse order history WebSocket message', { error: err });
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);

      // Unsubscribe from order updates
      const unsubscribeMessage = {
        id: Date.now(),
        method: 'UNSUBSCRIBE',
        params: [`${address.toLowerCase()}@orders`]
      };
      sendMessage(unsubscribeMessage);

      logger.info(`[OrderHistory] Cleaning up real-time updates for ${address.slice(0, 10)}...`);
    };
  }, [socket, address, symbol, limit, enableRealtime, isConnected, sendMessage]);

  // Calculate derived values
  const totalOrders = useMemo(() => {
    return orders.length;
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
    totalOrders,
    realtimeCount
  };
}

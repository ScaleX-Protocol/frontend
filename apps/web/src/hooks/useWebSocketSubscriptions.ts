import { useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from '@/providers/websocketProvider';
import { logger, LogLevel, LogLabel, ServiceName } from '@/utils/logger';

// Subscription message types (matching backend format)
export interface SubscriptionMessage {
  id: number;
  method: 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'LIST_SUBSCRIPTIONS' | 'PING';
  params?: string[];
  result?: any;
}

export interface DepthUpdate {
  type: 'depth_update';
  symbol: string;
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
  timestamp: number;
}

export interface TradeUpdate {
  type: 'trade';
  symbol: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface TickerUpdate {
  type: 'ticker';
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  volume: string;
  timestamp: number;
}

export interface OrderBookUpdate {
  type: 'orderbook';
  symbol: string;
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
  timestamp: number;
}

export type WebSocketMessage = DepthUpdate | TradeUpdate | TickerUpdate | OrderBookUpdate;

export interface UseWebSocketSubscriptionsReturn {
  subscribeToDepth: (symbol: string, callback: (data: DepthUpdate) => void) => () => void;
  subscribeToTrades: (symbol: string, callback: (data: TradeUpdate) => void) => () => void;
  subscribeToTicker: (symbol: string, callback: (data: TickerUpdate) => void) => () => void;
  subscribeToOrderBook: (symbol: string, callback: (data: OrderBookUpdate) => void) => () => void;
  subscribeToMultiple: (subscriptions: Array<{ channel: string; symbol: string; callback: (data: WebSocketMessage) => void }>) => () => void;
  isConnected: boolean;
}

export const useWebSocketSubscriptions = (): UseWebSocketSubscriptionsReturn => {
  const { socket, sendMessage, connectionState } = useWebSocket();
  const subscriptionsRef = useRef<Map<string, (data: WebSocketMessage) => void>>(new Map());
  const isConnectingRef = useRef(false);

  const generateSubscriptionId = useCallback((channel: string, symbol: string): string => {
    return `${channel}_${symbol}_${Date.now()}`;
  }, []);

  const createChannelName = useCallback((channel: string, symbol: string): string => {
    // Convert to lowercase and match backend format
    const normalizedSymbol = symbol.toLowerCase();
    const normalizedChannel = channel.toLowerCase();
    return `${normalizedSymbol}@${normalizedChannel}`;
  }, []);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);

      // Handle different message formats
      if (message.type && message.symbol) {
        // Direct update message
        const subscriptionKey = `${message.type}_${message.symbol}`;
        const callback = subscriptionsRef.current.get(subscriptionKey);

        if (callback) {
          callback(message as WebSocketMessage);
        }

        // Log the received message
        logger.log(
          LogLevel.INFO,
          LogLabel.WEBSOCKET,
          ServiceName.WEBSOCKET,
          `Received ${message.type} update for ${message.symbol}`,
          { message }
        );
      } else if (message.stream) {
        // Stream format (e.g., from Binance-style streams)
        const [channel, symbol] = message.stream.split('@');
        const subscriptionKey = `${channel}_${symbol}`;
        const callback = subscriptionsRef.current.get(subscriptionKey);

        if (callback && message.data) {
          callback({
            ...message.data,
            type: channel,
          } as WebSocketMessage);
        }

        logger.log(
          LogLevel.INFO,
          LogLabel.WEBSOCKET,
          ServiceName.WEBSOCKET,
          `Received stream update: ${message.stream}`,
          { message: message.data }
        );
      }
    } catch (error) {
      logger.log(
        LogLevel.ERROR,
        LogLabel.WEBSOCKET,
        ServiceName.WEBSOCKET,
        'Failed to parse WebSocket message',
        { error, data: event.data }
      );
    }
  }, []);

  // Set up message listener
  useEffect(() => {
    if (socket) {
      socket.addEventListener('message', handleWebSocketMessage);

      return () => {
        socket.removeEventListener('message', handleWebSocketMessage);
      };
    }
  }, [socket, handleWebSocketMessage]);

  const subscribe = useCallback((
    channel: string,
    symbol: string,
    callback: (data: WebSocketMessage) => void
  ): (() => void) => {
    if (!socket || connectionState !== 'OPEN') {
      logger.log(
        LogLevel.WARN,
        LogLabel.WEBSOCKET,
        ServiceName.WEBSOCKET,
        'Cannot subscribe: WebSocket not connected',
        { channel, symbol, connectionState }
      );
      return () => {};
    }

    const subscriptionId = generateSubscriptionId(channel, symbol);
    const subscriptionKey = `${channel}_${symbol}`;

    // Store the callback
    subscriptionsRef.current.set(subscriptionKey, callback);

    // Send subscription message (matching backend format)
    const subscriptionMessage: SubscriptionMessage = {
      id: Date.now(),
      method: 'SUBSCRIBE',
      params: [createChannelName(channel, symbol)]
    };

    sendMessage(subscriptionMessage);

    logger.log(
      LogLevel.INFO,
      LogLabel.WEBSOCKET,
      ServiceName.WEBSOCKET,
      `Subscribed to ${channel} for ${symbol}`,
      { subscriptionId, channel: subscriptionMessage.params.channels[0] }
    );

    // Return unsubscribe function
    return () => {
      if (socket && connectionState === 'OPEN') {
        const unsubscribeMessage: SubscriptionMessage = {
          id: Date.now(),
          method: 'UNSUBSCRIBE',
          params: [createChannelName(channel, symbol)]
        };

        sendMessage(unsubscribeMessage);
        subscriptionsRef.current.delete(subscriptionKey);

        logger.log(
          LogLevel.INFO,
          LogLabel.WEBSOCKET,
          ServiceName.WEBSOCKET,
          `Unsubscribed from ${channel} for ${symbol}`,
          { subscriptionId }
        );
      }
    };
  }, [socket, connectionState, sendMessage, generateSubscriptionId, createChannelName]);

  const subscribeToDepth = useCallback((
    symbol: string,
    callback: (data: DepthUpdate) => void
  ): (() => void) => {
    return subscribe('depth', symbol, callback as (data: WebSocketMessage) => void);
  }, [subscribe]);

  const subscribeToTrades = useCallback((
    symbol: string,
    callback: (data: TradeUpdate) => void
  ): (() => void) => {
    return subscribe('trade', symbol, callback as (data: WebSocketMessage) => void);
  }, [subscribe]);

  const subscribeToTicker = useCallback((
    symbol: string,
    callback: (data: TickerUpdate) => void
  ): (() => void) => {
    return subscribe('ticker', symbol, callback as (data: WebSocketMessage) => void);
  }, [subscribe]);

  const subscribeToOrderBook = useCallback((
    symbol: string,
    callback: (data: OrderBookUpdate) => void
  ): (() => void) => {
    return subscribe('orderbook', symbol, callback as (data: WebSocketMessage) => void);
  }, [subscribe]);

  const subscribeToMultiple = useCallback((
    subscriptions: Array<{ channel: string; symbol: string; callback: (data: WebSocketMessage) => void }>
  ): (() => void) => {
    const unsubscribers: Array<() => void> = [];

    subscriptions.forEach(({ channel, symbol, callback }) => {
      const unsubscribe = subscribe(channel, symbol, callback);
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe]);

  return {
    subscribeToDepth,
    subscribeToTrades,
    subscribeToTicker,
    subscribeToOrderBook,
    subscribeToMultiple,
    isConnected: connectionState === 'OPEN'
  };
};
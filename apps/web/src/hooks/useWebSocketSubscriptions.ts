import { useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from '@/providers/websocketProvider';
import { logger } from '@/utils/logger';

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

export interface KlineUpdate {
  type: 'kline';
  symbol: string;
  interval: string;
  openTime: number;
  closeTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  trades: number;
  isFinal: boolean;
}

export type WebSocketMessage = DepthUpdate | TradeUpdate | TickerUpdate | OrderBookUpdate | KlineUpdate;

export interface UseWebSocketSubscriptionsReturn {
  subscribeToDepth: (symbol: string, callback: (data: DepthUpdate) => void) => () => void;
  subscribeToTrades: (symbol: string, callback: (data: TradeUpdate) => void) => () => void;
  subscribeToTicker: (symbol: string, callback: (data: TickerUpdate) => void) => () => void;
  subscribeToOrderBook: (symbol: string, callback: (data: OrderBookUpdate) => void) => () => void;
  subscribeToKline: (symbol: string, interval: string, callback: (data: KlineUpdate) => void) => () => void;
  subscribeToMultiple: (subscriptions: Array<{ channel: string; symbol: string; callback: (data: WebSocketMessage) => void }>) => () => void;
  isConnected: boolean;
}
interface BackendDepthMessage {
  e: 'depthUpdate';
  E: number;
  s: string;
  b: Array<[string, string]>;
  a: Array<[string, string]>;
}

interface BackendTradeMessage {
  e: 'trade';
  E: number;
  s: string;
  t: string;
  p: string;
  q: string;
  T: number;
  m: boolean;
}

interface BackendKlineMessage {
  e: 'kline';
  E: number;
  s: string;
  k: {
    t: number;
    T: number;
    s: string;
    i: string;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    n: number;
    x: boolean;
  };
}

interface BackendStreamMessage {
  stream: string;
  data: BackendDepthMessage | BackendTradeMessage | BackendKlineMessage;
}

export const useWebSocketSubscriptions = (): UseWebSocketSubscriptionsReturn => {
  const { socket, sendMessage, connectionState } = useWebSocket();
  const subscriptionsRef = useRef<Map<string, (data: WebSocketMessage) => void>>(new Map());

  const createChannelName = useCallback((channel: string, symbol: string): string => {
    const normalizedSymbol = symbol.toLowerCase().replace('/', '');
    return `${normalizedSymbol}@${channel}`;
  }, []);

  const normalizeMessage = useCallback((rawMessage: any, stream?: string): WebSocketMessage | null => {
    try {
      if (rawMessage.e) {
        switch (rawMessage.e) {
          case 'depthUpdate': {
            const msg = rawMessage as BackendDepthMessage;
            return {
              type: 'depth_update',
              symbol: msg.s,
              bids: msg.b,
              asks: msg.a,
              timestamp: msg.E
            };
          }
          case 'trade': {
            const msg = rawMessage as BackendTradeMessage;
            return {
              type: 'trade',
              symbol: msg.s,
              price: msg.p,
              quantity: msg.q,
              side: msg.m ? 'sell' : 'buy',
              timestamp: msg.T || msg.E
            };
          }
          case 'kline': {
            const msg = rawMessage as BackendKlineMessage;
            return {
              type: 'kline',
              symbol: msg.s,
              interval: msg.k.i,
              openTime: msg.k.t,
              closeTime: msg.k.T,
              open: msg.k.o,
              high: msg.k.h,
              low: msg.k.l,
              close: msg.k.c,
              volume: msg.k.v,
              trades: msg.k.n,
              isFinal: msg.k.x
            };
          }
        }
      }

      if (rawMessage.type && rawMessage.symbol) {
        return rawMessage as WebSocketMessage;
      }

      return null;
    } catch (error) {
      logger.error('Failed to normalize WebSocket message', { error, rawMessage });
      return null;
    }
  }, []);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);

      if (message.id !== undefined && message.result !== undefined) {
        return;
      }

      if (message.stream && message.data) {
        const streamMessage = message as BackendStreamMessage;
        const [symbolFromStream, channel] = streamMessage.stream.split('@');
        const baseChannel = channel.startsWith('kline_') ? channel : channel;

        const subscriptionKeyNoSlash = `${baseChannel}_${symbolFromStream.toUpperCase()}`;
        const subscriptionKeyWithSlash = `${baseChannel}_${symbolFromStream.toUpperCase().replace(/^(.+?)(GSUSDC|USDC|USDT|ETH|BTC)$/i, '$1/$2')}`;

        let callback = subscriptionsRef.current.get(subscriptionKeyWithSlash);

        if (!callback) {
          callback = subscriptionsRef.current.get(subscriptionKeyNoSlash);
        }

        if (callback) {
          const normalized = normalizeMessage(streamMessage.data, streamMessage.stream);
          if (normalized) {
            callback(normalized);
          }
        }

        return;
      }

      if (message.e) {
        const normalized = normalizeMessage(message);
        if (normalized && normalized.symbol) {
          const symbol = normalized.symbol.toUpperCase();
          let subscriptionKey = '';

          switch (normalized.type) {
            case 'depth_update':
              subscriptionKey = `depth_${symbol}`;
              break;
            case 'trade':
              subscriptionKey = `trade_${symbol}`;
              break;
            case 'kline':
              subscriptionKey = `kline_${(normalized as KlineUpdate).interval}_${symbol}`;
              break;
          }

          const callback = subscriptionsRef.current.get(subscriptionKey);
          if (callback) {
            callback(normalized);
          }
        }

        return;
      }

      if (message.type && message.symbol) {
        const subscriptionKey = `${message.type}_${message.symbol.toUpperCase()}`;
        const callback = subscriptionsRef.current.get(subscriptionKey);
        if (callback) {
          callback(message as WebSocketMessage);
        }
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message', { error, data: event.data });
    }
  }, [normalizeMessage]);

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
    if (!socket || connectionState !== 'open') {
      logger.warn('[WS] Cannot subscribe: not connected', { channel, symbol, connectionState });
      return () => {};
    }

    const subscriptionKey = `${channel}_${symbol.toUpperCase()}`;
    const streamName = createChannelName(channel, symbol);

    subscriptionsRef.current.set(subscriptionKey, callback);

    const subscriptionMessage: SubscriptionMessage = {
      id: Date.now() + Math.random(),
      method: 'SUBSCRIBE',
      params: [streamName]
    };

    sendMessage(subscriptionMessage);

    return () => {
      if (socket && connectionState === 'open') {
        const unsubscribeMessage: SubscriptionMessage = {
          id: Date.now(),
          method: 'UNSUBSCRIBE',
          params: [streamName]
        };

        sendMessage(unsubscribeMessage);
        subscriptionsRef.current.delete(subscriptionKey);
      }
    };
  }, [socket, connectionState, sendMessage, createChannelName]);

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
    return subscribe('miniTicker', symbol, callback as (data: WebSocketMessage) => void);
  }, [subscribe]);

  const subscribeToOrderBook = useCallback((
    symbol: string,
    callback: (data: OrderBookUpdate) => void
  ): (() => void) => {
    return subscribe('depth', symbol, (data) => {
      // Convert depth update to orderbook update format
      if (data.type === 'depth_update') {
        callback({
          type: 'orderbook',
          symbol: data.symbol,
          bids: data.bids,
          asks: data.asks,
          timestamp: data.timestamp
        });
      }
    });
  }, [subscribe]);

  const subscribeToKline = useCallback((
    symbol: string,
    interval: string,
    callback: (data: KlineUpdate) => void
  ): (() => void) => {
    return subscribe(`kline_${interval}`, symbol, callback as (data: WebSocketMessage) => void);
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
    subscribeToKline,
    subscribeToMultiple,
    isConnected: connectionState === 'open'
  };
};

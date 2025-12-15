'use client';

import { useEffect, useCallback } from 'react';
import { useWebSocket } from '@/providers/websocketProvider';
import { useAutoWebSocketSubscriptions } from '@/hooks/useAutoWebSocketSubscriptions';
import { logger, LogLevel, LogLabel, ServiceName } from '@/utils/logger';

// Default trading symbol for the ScaleX platform
const DEFAULT_SYMBOL = 'gswethgsusdc';

/**
 * Auto WebSocket Subscriptions Component
 *
 * This component automatically subscribes to necessary WebSocket streams
 * for trading data when the WebSocket connection is established.
 * It should be rendered once in the app to ensure subscriptions are active.
 */
export function AutoWebSocketSubscriptions() {
  const { connectionState, lastMessage } = useWebSocket();
  const isConnected = connectionState === 'open';

  // Memoize callback functions to prevent infinite re-renders
  const onDepthUpdate = useCallback((data: any) => {
    logger.log(
      LogLevel.DEBUG,
      `Depth update received for ${DEFAULT_SYMBOL}`,
      LogLabel.WEBSOCKET,
      ServiceName.WEBSOCKET,
      { bidCount: data.bids?.length || 0, askCount: data.asks?.length || 0 }
    );
  }, []);

  const onTradeUpdate = useCallback((data: any) => {
    logger.log(
      LogLevel.DEBUG,
      `Trade update received for ${DEFAULT_SYMBOL}`,
      LogLabel.WEBSOCKET,
      ServiceName.WEBSOCKET,
      { price: data.price, quantity: data.quantity, side: data.side }
    );
  }, []);

  const onTickerUpdate = useCallback((data: any) => {
    logger.log(
      LogLevel.DEBUG,
      `Ticker update received for ${DEFAULT_SYMBOL}`,
      LogLabel.WEBSOCKET,
      ServiceName.WEBSOCKET,
      { price: data.price, priceChange: data.priceChange }
    );
  }, []);

  const onKlineUpdate = useCallback((data: any) => {
    logger.log(
      LogLevel.DEBUG,
      `Kline update received for ${DEFAULT_SYMBOL}`,
      LogLabel.WEBSOCKET,
      ServiceName.WEBSOCKET,
      { interval: data.interval, price: data.close }
    );
  }, []);

  // Set up automatic subscriptions for default trading pairs
  const { isConnected: subscriptionActive, hasActiveSubscriptions } = useAutoWebSocketSubscriptions({
    symbol: DEFAULT_SYMBOL,
    enableDepth: true,
    enableTrades: true,
    enableTicker: true,
    enableKline: true,
    onDepthUpdate,
    onTradeUpdate,
    onTickerUpdate,
    onKlineUpdate,
  });

  // Log connection and subscription status
  useEffect(() => {
    logger.log(
      LogLevel.INFO,
      `Auto WebSocket Subscriptions Status`,
      LogLabel.WEBSOCKET,
      ServiceName.WEBSOCKET,
      {
        isConnected,
        subscriptionActive,
        hasActiveSubscriptions,
        symbol: DEFAULT_SYMBOL,
        connectionState: connectionState // Add connection state for debugging
      }
    );
  }, [isConnected, subscriptionActive, hasActiveSubscriptions, connectionState]);

  // Log received messages for debugging
  useEffect(() => {
    if (lastMessage) {
      logger.log(
        LogLevel.DEBUG,
        'WebSocket message received',
        LogLabel.WEBSOCKET,
        ServiceName.WEBSOCKET,
        {
          type: typeof lastMessage,
          timestamp: Date.now(),
          // Only log first 100 chars to avoid spam
          preview: JSON.stringify(lastMessage).substring(0, 100)
        }
      );
    }
  }, [lastMessage]);

  // This component doesn't render anything visible
  return null;
}
import { useEffect } from 'react';
import { useWebSocketSubscriptions } from './useWebSocketSubscriptions';
import { logger, LogLevel, LogLabel, ServiceName } from '@/utils/logger';

interface AutoSubscriptionConfig {
  symbol: string;
  enableDepth?: boolean;
  enableTrades?: boolean;
  enableTicker?: boolean;
  enableKline?: boolean;
  onDepthUpdate?: (data: any) => void;
  onTradeUpdate?: (data: any) => void;
  onTickerUpdate?: (data: any) => void;
  onKlineUpdate?: (data: any) => void;
}

/**
 * Hook that automatically subscribes to all necessary WebSocket streams
 * for a given trading symbol. Based on the backend websocket-client configuration.
 */
export function useAutoWebSocketSubscriptions(config: AutoSubscriptionConfig) {
  const {
    symbol,
    enableDepth = true,
    enableTrades = true,
    enableTicker = true,
    enableKline = true,
    onDepthUpdate,
    onTradeUpdate,
    onTickerUpdate,
    onKlineUpdate
  } = config;

  const {
    subscribeToDepth,
    subscribeToTrades,
    subscribeToTicker,
    subscribeToMultiple,
    isConnected
  } = useWebSocketSubscriptions();

  useEffect(() => {
    if (!symbol || !isConnected) {
      logger.log(
        LogLevel.WARN,
        LogLabel.WEBSOCKET,
        ServiceName.WEBSOCKET,
        `Cannot auto-subscribe: WebSocket not connected or symbol missing`,
        { symbol, isConnected }
      );
      return;
    }

    logger.log(
      LogLevel.INFO,
      LogLabel.WEBSOCKET,
      ServiceName.WEBSOCKET,
      `Setting up auto-subscriptions for ${symbol}`,
      {
        enableDepth,
        enableTrades,
        enableTicker,
        enableKline
      }
    );

    const subscriptions: Array<{ channel: string; symbol: string; callback: (data: any) => void }> = [];

    // Add depth subscription
    if (enableDepth && onDepthUpdate) {
      subscriptions.push({
        channel: 'depth',
        symbol,
        callback: onDepthUpdate
      });
    }

    // Add trades subscription
    if (enableTrades && onTradeUpdate) {
      subscriptions.push({
        channel: 'trade',
        symbol,
        callback: onTradeUpdate
      });
    }

    // Add ticker subscription
    if (enableTicker && onTickerUpdate) {
      subscriptions.push({
        channel: 'miniticker',
        symbol,
        callback: onTickerUpdate
      });
    }

    // Add kline subscription (1-minute intervals)
    if (enableKline && onKlineUpdate) {
      subscriptions.push({
        channel: 'kline_1m',
        symbol,
        callback: onKlineUpdate
      });
    }

    // Subscribe to all configured streams
    if (subscriptions.length > 0) {
      logger.log(
        LogLevel.INFO,
        LogLabel.WEBSOCKET,
        ServiceName.WEBSOCKET,
        `Subscribing to ${subscriptions.length} streams for ${symbol}`,
        { streams: subscriptions.map(s => `${s.symbol}@${s.channel}`) }
      );

      const unsubscribe = subscribeToMultiple(subscriptions);

      return () => {
        logger.log(
          LogLevel.INFO,
          LogLabel.WEBSOCKET,
          ServiceName.WEBSOCKET,
          `Cleaning up all subscriptions for ${symbol}`
        );
        unsubscribe();
      };
    }
  }, [
    symbol,
    isConnected,
    enableDepth,
    enableTrades,
    enableTicker,
    enableKline,
    onDepthUpdate,
    onTradeUpdate,
    onTickerUpdate,
    onKlineUpdate,
    subscribeToMultiple
  ]);

  return {
    isConnected,
    hasActiveSubscriptions: !!(symbol && isConnected && (
      (enableDepth && onDepthUpdate) ||
      (enableTrades && onTradeUpdate) ||
      (enableTicker && onTickerUpdate) ||
      (enableKline && onKlineUpdate)
    ))
  };
}

/**
 * Default configuration for common trading pairs
 */
export const DEFAULT_TRADING_SUBSCRIPTIONS = {
  gswethgsusdc: {
    enableDepth: true,
    enableTrades: true,
    enableTicker: true,
    enableKline: true
  }
};

/**
 * Helper function to get default subscription config for a symbol
 */
export function getDefaultSubscriptionConfig(symbol: string) {
  return DEFAULT_TRADING_SUBSCRIPTIONS[symbol.toLowerCase() as keyof typeof DEFAULT_TRADING_SUBSCRIPTIONS] || {
    enableDepth: true,
    enableTrades: true,
    enableTicker: true,
    enableKline: false // Only enable klines for configured pairs by default
  };
}
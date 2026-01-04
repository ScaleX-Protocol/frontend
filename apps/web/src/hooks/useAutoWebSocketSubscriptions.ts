import { useEffect } from 'react';
import { useWebSocketSubscriptions } from './useWebSocketSubscriptions';

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
    if (!symbol || !isConnected) return;

    const subscriptions: Array<{ channel: string; symbol: string; callback: (data: any) => void }> = [];

    if (enableDepth && onDepthUpdate) {
      subscriptions.push({ channel: 'depth', symbol, callback: onDepthUpdate });
    }
    if (enableTrades && onTradeUpdate) {
      subscriptions.push({ channel: 'trade', symbol, callback: onTradeUpdate });
    }
    if (enableTicker && onTickerUpdate) {
      subscriptions.push({ channel: 'miniTicker', symbol, callback: onTickerUpdate });
    }
    if (enableKline && onKlineUpdate) {
      subscriptions.push({ channel: 'kline_1m', symbol, callback: onKlineUpdate });
    }

    if (subscriptions.length > 0) {
      const unsubscribe = subscribeToMultiple(subscriptions);
      return () => unsubscribe();
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

export const DEFAULT_TRADING_SUBSCRIPTIONS = {
  gswethgsusdc: {
    enableDepth: true,
    enableTrades: true,
    enableTicker: true,
    enableKline: true
  }
};

export function getDefaultSubscriptionConfig(symbol: string) {
  return DEFAULT_TRADING_SUBSCRIPTIONS[symbol.toLowerCase() as keyof typeof DEFAULT_TRADING_SUBSCRIPTIONS] || {
    enableDepth: true,
    enableTrades: true,
    enableTicker: true,
    enableKline: false
  };
}
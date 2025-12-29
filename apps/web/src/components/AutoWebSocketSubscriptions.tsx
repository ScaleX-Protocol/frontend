'use client';

import { useCallback } from 'react';
import { useAutoWebSocketSubscriptions } from '@/hooks/useAutoWebSocketSubscriptions';

const DEFAULT_SYMBOL = 'gswethgsusdc';

export function AutoWebSocketSubscriptions() {
  const onDepthUpdate = useCallback((data: any) => {}, []);
  const onTradeUpdate = useCallback((data: any) => {}, []);
  const onTickerUpdate = useCallback((data: any) => {}, []);
  const onKlineUpdate = useCallback((data: any) => {}, []);

  useAutoWebSocketSubscriptions({
    symbol: DEFAULT_SYMBOL,
    enableDepth: true,
    enableTrades: true,
    enableTicker: true,
    enableKline: false,
    onDepthUpdate,
    onTradeUpdate,
    onTickerUpdate,
    onKlineUpdate,
  });

  return null;
}
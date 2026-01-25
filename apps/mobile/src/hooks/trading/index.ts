/**
 * Mobile-optimized trading hooks
 *
 * This module exports mobile-specific hooks with offline support, caching, and battery optimization.
 * These replace the web hooks from @scalex/service-trading with mobile-optimized versions.
 */

// Chart hooks - mobile-optimized
export { useMarkets } from '../../hooks-mobile/chart/useMarkets';
export { useTicker24hr } from '../../hooks-mobile/chart/useTicker24hr';
export { useTickerPrice } from '../../hooks-mobile/chart/useTickerPrice';
export { useKline } from '../../hooks-mobile/chart/useKline';
export { useDepth as useChartDepth, type UseDepthParams as ChartDepthParams } from '../../hooks-mobile/chart/useDepth';
export { usePairs } from '../../hooks-mobile/chart/usePairs';

// OrderBook hooks - mobile-optimized
export { useOrderBookDepth, type UseOrderBookDepthParams as OrderBookDepthParams } from '../../hooks-mobile/orderbook/useOrderBookDepth';
export { useOrderBookTrades, type UseOrderBookTradesParams as OrderBookTradesParams } from '../../hooks-mobile/orderbook/useOrderBookTrades';
export { useDepthWithRealtime, type UseDepthWithRealtimeParams } from '../../hooks-mobile/orderbook/useDepthWithRealtime';
export { useTradesWithRealtime, type UseTradesWithRealtimeParams } from '../../hooks-mobile/orderbook/useTradesWithRealtime';

// History hooks - mobile-optimized
export { useAccount } from '../../hooks-mobile/history/useAccount';
export { useAllOrders } from '../../hooks-mobile/history/useAllOrders';
export { useOpenOrders } from '../../hooks-mobile/history/useOpenOrders';
export { useTrades as useHistoryTrades, type UseTradesParams as HistoryTradesParams } from '../../hooks-mobile/history/useTrades';

// Utility hooks - mobile-optimized
export { useTradeBalances, formatBalance, hasSufficientBalance } from '../../hooks-mobile/utils/useTradeBalances';
export { useTradingRules } from '../../hooks-mobile/utils/useTradingRules';

// Mobile stub for usePrivyPlaceOrder (Privy not available in mobile)
// Also exports the types and enums needed for trading
export { usePrivyPlaceOrder, OrderSide, TimeInForce, OrderStep, type Pool } from './usePrivyPlaceOrder';

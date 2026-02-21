/**
 * Mobile-optimized trading hooks
 *
 * This module exports mobile-specific hooks with offline support, caching, and battery optimization.
 * These replace the web hooks from @scalex/service-trading with mobile-optimized versions.
 */

// Chart hooks - mobile-optimized
export { useMarkets } from '../trade/chart/useMarkets';
export { useTicker24hr } from '../trade/chart/useTicker24hr';
export { useTickerPrice } from '../trade/chart/useTickerPrice';
export { useKline } from '../trade/chart/useKline';
export { useDepth as useChartDepth, type UseDepthParams as ChartDepthParams } from '../trade/chart/useDepth';
export { usePairs } from '../trade/chart/usePairs';

// OrderBook hooks - mobile-optimized
export { useOrderBookDepth, type UseOrderBookDepthParams as OrderBookDepthParams } from '../trade/orderbook/useOrderBookDepth';
export { useOrderBookTrades, type UseOrderBookTradesParams as OrderBookTradesParams } from '../trade/orderbook/useOrderBookTrades';
export { useDepthWithRealtime, type UseDepthWithRealtimeParams } from '../trade/orderbook/useDepthWithRealtime';
export { useTradesWithRealtime, type UseTradesWithRealtimeParams } from '../trade/orderbook/useTradesWithRealtime';

// History hooks - mobile-optimized
export { useAccount } from '../trade/history/useAccount';
export { useAllOrders } from '../trade/history/useAllOrders';
export { useOpenOrders } from '../trade/history/useOpenOrders';
export { useTrades as useHistoryTrades, type UseTradesParams as HistoryTradesParams } from '../trade/history/useTrades';

// Utility hooks - mobile-optimized
export { useTradeBalances, formatBalance, hasSufficientBalance } from '../trade/utils/useTradeBalances';
export { useTradingRules } from '../trade/utils/useTradingRules';

// Mobile stub for usePrivyPlaceOrder (Privy not available in mobile)
// Also exports the types and enums needed for trading
export { usePrivyPlaceOrder, OrderSide, TimeInForce, OrderStep, type Pool } from './usePrivyPlaceOrder';

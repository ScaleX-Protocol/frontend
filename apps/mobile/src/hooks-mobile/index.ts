/**
 * Mobile-optimized hooks with offline support, caching, and battery optimization
 * These hooks replace imports from @scalex/service-trading and @scalex/service-wallet
 */

// Chart hooks
export * from './chart/useMarkets';
export * from './chart/useTicker24hr';
export * from './chart/useTickerPrice';
export * from './chart/useKline';
export * from './chart/usePairs';
export * from './chart/useDepth';

// Wallet hooks
export * from './wallet/useCurrencies';
export * from './wallet/useCurrency';

// History/Account hooks
export * from './history/useAccount';
export * from './history/useAllOrders';
export * from './history/useOpenOrders';
export * from './history/useTrades';

// OrderBook hooks
export * from './orderbook/useOrderBookDepth';
export * from './orderbook/useOrderBookTrades';
export * from './orderbook/useDepthWithRealtime';
export * from './orderbook/useTradesWithRealtime';

// Utility hooks
export * from './utils/useTradeBalances';
export * from './utils/useTradingRules';

// Re-export types that might be needed
export type { UseKlineParams } from './chart/useKline';
export type { UseDepthParams } from './chart/useDepth';
export type { UseCurrenciesParams } from './wallet/useCurrencies';
export type { UseAllOrdersParams } from './history/useAllOrders';
export type { UseOpenOrdersParams } from './history/useOpenOrders';
export type { UseTradesParams } from './history/useTrades';
export type { UseOrderBookDepthParams } from './orderbook/useOrderBookDepth';
export type { UseOrderBookTradesParams } from './orderbook/useOrderBookTrades';
export type { UseDepthWithRealtimeParams } from './orderbook/useDepthWithRealtime';
export type { UseTradesWithRealtimeParams } from './orderbook/useTradesWithRealtime';

/**
 * Storage keys used throughout the application
 * These keys are used with MMKV for persistent storage
 */

export const STORAGE_KEYS = {
  /**
   * Currently selected market for trading
   * Type: string (market pair identifier)
   */
  SELECTED_MARKET: 'selected_market',

  /**
   * User's favorite/favorite markets
   * Type: string[] (array of market pair identifiers)
   */
  FAVORITE_MARKETS: 'favorite_markets',

  /**
   * Selected chart timeframe
   * Type: string (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
   */
  CHART_TIMEFRAME: 'chart_timeframe',

  /**
   * Default order type for trading
   * Type: string ('market' | 'limit' | 'stop-limit')
   */
  DEFAULT_ORDER_TYPE: 'default_order_type',

  /**
   * Prefix for caching klines data
   * Usage: `${KLINES_CACHE_PREFIX}_${market}_${timeframe}`
   * Type: object (klines data)
   */
  KLINES_CACHE_PREFIX: 'klines_cache',

  /**
   * User preferences theme
   * Type: string ('light' | 'dark' | 'auto')
   */
  THEME: 'theme',

  /**
   * Currency display preference
   * Type: string (currency code)
   */
  CURRENCY: 'currency',
} as const;

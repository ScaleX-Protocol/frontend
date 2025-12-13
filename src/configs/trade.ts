/**
 * Trade configuration
 * Contains hardcoded values for trade-related features
 *
 * Note: Decimals are NOT stored here as they are token-specific.
 * Get decimals from token metadata instead.
 */

export interface TradeConfig {
  // Fee configurations
  fees: {
    takerFeeRate: number;    // Taker fee rate (e.g., 0.001 = 0.1%)
    makerFeeRate: number;    // Maker fee rate (e.g., 0.0005 = 0.05%)
    defaultFeeRate: number;  // Default fee rate when type is unknown
  };

  // Query configurations
  query: {
    defaultLimit: number;          // Default number of records to fetch
    autoRefreshInterval: number;   // Auto-refresh interval in milliseconds (0 = disabled)
  };
}

export const TRADE_CONFIG: TradeConfig = {
  fees: {
    takerFeeRate: 0.001,    // 0.1% taker fee
    makerFeeRate: 0.0005,   // 0.05% maker fee
    defaultFeeRate: 0.001,  // Default to 0.1% when unknown
  },

  query: {
    defaultLimit: 10,            // Fetch 10 records by default
    autoRefreshInterval: 3000,   // Refresh every 3 seconds
  },
} as const;

/**
 * Helper function to get fee rate based on order type
 */
export const getFeeRate = (isMaker?: boolean): number => {
  if (isMaker === undefined) {
    return TRADE_CONFIG.fees.defaultFeeRate;
  }
  return isMaker ? TRADE_CONFIG.fees.makerFeeRate : TRADE_CONFIG.fees.takerFeeRate;
};

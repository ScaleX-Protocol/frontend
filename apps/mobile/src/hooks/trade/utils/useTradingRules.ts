/**
 * Mobile-optimized hook to get trading rules
 * Note: This is a stub implementation for mobile
 * The web version uses wagmi/viem which may not be fully compatible with React Native
 *
 * TODO: Implement proper trading rules fetching for mobile when wallet integration is ready
 * For now, return default trading rules
 */

interface TradingRules {
  minTradeAmount: bigint;
  minAmountMovement: bigint;
  minPriceMovement: bigint;
  minOrderSize: bigint;
}

interface UseTradingRulesParams {
  baseTokenAddress: string;
  quoteTokenAddress: string;
}

interface UseTradingRulesReturn {
  tradingRules: TradingRules | undefined;
  orderBookAddress: string | undefined;
  poolKey: any;
  isLoading: boolean;
  error: Error | null;
}

export function useTradingRules({ baseTokenAddress, quoteTokenAddress }: UseTradingRulesParams): UseTradingRulesReturn {
  // TODO: Implement proper trading rules when wagmi is ready for mobile
  // For now, return sensible defaults

  const defaultRules: TradingRules = {
    minTradeAmount: BigInt(1000000), // 1 USDC (6 decimals)
    minAmountMovement: BigInt(100000), // 0.1 USDC
    minPriceMovement: BigInt(1000), // Minimum price tick
    minOrderSize: BigInt(1000000), // 1 USDC minimum order
  };

  return {
    tradingRules: defaultRules,
    orderBookAddress: undefined,
    poolKey: undefined,
    isLoading: false,
    error: null,
  };
}

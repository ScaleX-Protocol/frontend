import { formatUnits } from 'viem';

/**
 * Swap utility functions
 * Provides helper functions for token swap operations
 */

/**
 * Calculate slippage amount from percentage
 * @param amount - The amount to calculate slippage for
 * @param slippagePercent - Slippage percentage (e.g., 1 for 1%)
 * @returns Slippage amount
 */
export function calculateSlippageAmount(
  amount: bigint,
  slippagePercent: number
): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100));
  return (amount * slippageBps) / 10000n;
}

/**
 * Convert slippage percentage to basis points
 * @param percent - Percentage (e.g., 1 for 1%, 0.5 for 0.5%)
 * @returns Basis points (e.g., 100 for 1%, 50 for 0.5%)
 */
export function percentToBps(percent: number): number {
  return Math.floor(percent * 100);
}

/**
 * Convert basis points to percentage
 * @param bps - Basis points (e.g., 100 for 1%)
 * @returns Percentage (e.g., 1 for 1%)
 */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/**
 * Calculate minimum output amount with slippage
 * @param expectedOutput - Expected output amount (in wei)
 * @param slippageBps - Slippage tolerance in basis points
 * @returns Minimum output amount
 */
export function calculateMinOutput(
  expectedOutput: bigint,
  slippageBps: number
): bigint {
  const slippageAmount = (expectedOutput * BigInt(slippageBps)) / 10000n;
  return expectedOutput - slippageAmount;
}

/**
 * Calculate expected output with slippage applied
 * @param minOutput - Minimum output amount (in wei)
 * @param slippageBps - Slippage tolerance in basis points
 * @returns Expected output before slippage
 */
export function calculateExpectedOutput(
  minOutput: bigint,
  slippageBps: number
): bigint {
  // Reverse calculation: minOutput = expected - (expected * slippageBps / 10000)
  // minOutput = expected * (1 - slippageBps/10000)
  // expected = minOutput / (1 - slippageBps/10000)
  const multiplier = 10000n - BigInt(slippageBps);
  return (minOutput * 10000n) / multiplier;
}

/**
 * Calculate price impact percentage
 * @param inputAmount - Input amount in wei
 * @param outputAmount - Output amount in wei
 * @param expectedPrice - Expected price (output/input ratio)
 * @param decimals - Decimals for percentage calculation
 * @returns Price impact in percentage (e.g., 2.5 for 2.5%)
 */
export function calculatePriceImpact(
  inputAmount: bigint,
  outputAmount: bigint,
  expectedPrice: number
): number {
  if (inputAmount === 0n) return 0;

  const actualPrice = Number(outputAmount) / Number(inputAmount);
  const priceImpact = ((expectedPrice - actualPrice) / expectedPrice) * 100;

  return Math.max(0, priceImpact);
}

/**
 * Format swap route display
 * @param tokens - Array of token symbols in the route
 * @returns Formatted route string (e.g., "WETH → USDC → DAI")
 */
export function formatSwapRoute(tokens: string[]): string {
  return tokens.join(' → ');
}

/**
 * Estimate gas for swap based on number of hops
 * @param hops - Number of hops in the swap route
 * @returns Estimated gas units
 */
export function estimateSwapGas(hops: number): number {
  const baseGas = 150000; // Base gas for simple swap
  const gasPerHop = 100000; // Additional gas per hop
  return baseGas + (hops - 1) * gasPerHop;
}

/**
 * Validate slippage tolerance
 * @param slippageBps - Slippage in basis points
 * @returns True if valid, false otherwise
 */
export function isValidSlippage(slippageBps: number): boolean {
  return slippageBps >= 0 && slippageBps <= 10000;
}

/**
 * Get recommended slippage for token pair volatility
 * @param volatility - 'low' | 'medium' | 'high'
 * @returns Recommended slippage in basis points
 */
export function getRecommendedSlippage(
  volatility: 'low' | 'medium' | 'high'
): number {
  switch (volatility) {
    case 'low':
      return 50; // 0.5%
    case 'medium':
      return 100; // 1%
    case 'high':
      return 300; // 3%
    default:
      return 100;
  }
}

/**
 * Format swap amount for display
 * @param amount - Amount in wei
 * @param decimals - Token decimals
 * @param maxDecimals - Maximum decimal places to show
 * @returns Formatted string
 */
export function formatSwapAmount(
  amount: bigint,
  decimals: number,
  maxDecimals: number = 6
): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);

  if (num === 0) return '0';
  if (num < 0.000001) return '< 0.000001';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Calculate swap output ratio
 * @param inputAmount - Input amount in wei
 * @param outputAmount - Output amount in wei
 * @param inputDecimals - Input token decimals
 * @param outputDecimals - Output token decimals
 * @returns Exchange rate (output per 1 input)
 */
export function calculateSwapRate(
  inputAmount: bigint,
  outputAmount: bigint,
  inputDecimals: number,
  outputDecimals: number
): number {
  if (inputAmount === 0n) return 0;

  const inputFormatted = parseFloat(formatUnits(inputAmount, inputDecimals));
  const outputFormatted = parseFloat(formatUnits(outputAmount, outputDecimals));

  return outputFormatted / inputFormatted;
}

/**
 * Format swap rate for display
 * @param rate - Exchange rate
 * @param srcSymbol - Source token symbol
 * @param dstSymbol - Destination token symbol
 * @returns Formatted rate string (e.g., "1 WETH = 3000 USDC")
 */
export function formatSwapRate(
  rate: number,
  srcSymbol: string,
  dstSymbol: string
): string {
  return `1 ${srcSymbol} = ${rate.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} ${dstSymbol}`;
}

/**
 * Validate swap parameters
 * @param params - Swap parameters
 * @returns Validation result with error message if invalid
 */
export function validateSwapParams(params: {
  srcToken: string;
  dstToken: string;
  amount: string;
  slippageBps: number;
}): { valid: boolean; error?: string } {
  if (!params.srcToken || !params.dstToken) {
    return { valid: false, error: 'Token addresses are required' };
  }

  if (params.srcToken.toLowerCase() === params.dstToken.toLowerCase()) {
    return { valid: false, error: 'Source and destination tokens must be different' };
  }

  const amount = parseFloat(params.amount);
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (!isValidSlippage(params.slippageBps)) {
    return { valid: false, error: 'Invalid slippage tolerance (must be 0-10000 bps)' };
  }

  return { valid: true };
}

/**
 * Parse swap error from contract
 * @param error - Error object from contract call
 * @returns User-friendly error message
 */
export function parseSwapError(error: unknown): string {
  const message = (error as Error)?.message || String(error) || '';

  if (message.includes('NoValidSwapPath')) {
    return 'No trading path available between these tokens. Try a different pair or check liquidity.';
  }

  if (message.includes('InsufficientSwapBalance')) {
    return 'Insufficient balance for this swap. Please check your wallet balance.';
  }

  if (message.includes('SlippageTooHigh')) {
    return 'Price moved unfavorably. Increase slippage tolerance or try a smaller amount.';
  }

  if (message.includes('IdenticalCurrencies')) {
    return 'Cannot swap a token with itself. Please select different tokens.';
  }

  if (message.includes('TooManyHops')) {
    return 'Swap route is too complex. Try a more direct token pair.';
  }

  if (message.includes('execution reverted')) {
    return 'Transaction would fail. Please check swap parameters and try again.';
  }

  return message || 'Swap failed. Please try again.';
}

/**
 * Calculate minimum hops needed
 * @param hasDirectPool - Whether a direct pool exists
 * @param hasIntermediaryPath - Whether a multi-hop path exists
 * @returns Minimum number of hops needed
 */
export function calculateMinHops(
  hasDirectPool: boolean,
  hasIntermediaryPath: boolean
): number {
  if (hasDirectPool) return 1;
  if (hasIntermediaryPath) return 2;
  return 3;
}

/**
 * Format slippage for display
 * @param slippageBps - Slippage in basis points
 * @returns Formatted percentage string (e.g., "1.0%")
 */
export function formatSlippage(slippageBps: number): string {
  const percent = bpsToPercent(slippageBps);
  return `${percent.toFixed(1)}%`;
}

/**
 * Check if slippage is within warning threshold
 * @param slippageBps - Slippage in basis points
 * @param warningThreshold - Warning threshold in basis points (default: 500 = 5%)
 * @returns True if slippage is high and should show warning
 */
export function isHighSlippage(
  slippageBps: number,
  warningThreshold: number = 500
): boolean {
  return slippageBps > warningThreshold;
}

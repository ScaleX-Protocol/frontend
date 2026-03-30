/**
 * Compute the minOutAmount and its decimals for a market order.
 *
 * estimatedOutput is already slippage-adjusted (1% tolerance applied by the contract
 * via calculateMinOutAmountForMarket). This function just routes it to the correct
 * decimal precision based on which token is received.
 *
 * BUY:  spending quote → receiving base  → minOutDecimals = baseDecimals
 * SELL: spending base  → receiving quote → minOutDecimals = quoteDecimals
 */
export function computeMinOutAmount(
  estimatedOutput: string | undefined | null,
  side: 0 | 1,
  baseDecimals: number,
  quoteDecimals: number,
): { minOutAmount: string; minOutDecimals: number } {
  const minOutDecimals = side === 0 ? baseDecimals : quoteDecimals;

  const parsed = estimatedOutput ? parseFloat(estimatedOutput) : NaN;
  const isValid = !isNaN(parsed) && parsed > 0;
  const minOutAmount = isValid ? estimatedOutput! : '0';

  return { minOutAmount, minOutDecimals };
}

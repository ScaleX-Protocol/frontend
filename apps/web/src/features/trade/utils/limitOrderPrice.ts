/**
 * Compute the default price to pre-fill in the limit order form.
 *
 * BUY  → use bestBid (join the buy queue); fallback to tickerPrice × 0.99
 * SELL → use bestAsk (join the sell queue); fallback to tickerPrice × 1.01
 *
 * Returns null when no price data is available (leave field empty).
 */
export function computeDefaultLimitPrice(
  buySell: 'buy' | 'sell',
  bestBid: number | null,
  bestAsk: number | null,
  tickerPrice: number | null,
): string | null {
  let price: number | null = null;

  if (buySell === 'buy') {
    if (bestBid !== null && bestBid > 0) {
      price = bestBid;
    } else if (tickerPrice !== null && tickerPrice > 0) {
      price = tickerPrice * 0.99;
    }
  } else {
    if (bestAsk !== null && bestAsk > 0) {
      price = bestAsk;
    } else if (tickerPrice !== null && tickerPrice > 0) {
      price = tickerPrice * 1.01;
    }
  }

  if (price === null || price <= 0) return null;

  // Format: use 8dp for sub-1 prices (e.g. SHIB), 2dp for ≥1, strip trailing zeros
  const formatted = price.toFixed(price < 1 ? 8 : 2).replace(/\.?0+$/, '');
  return formatted;
}

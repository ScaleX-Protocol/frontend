/**
 * Shared market identity type for all trade components.
 * `symbol` is intentionally excluded — each component derives the
 * symbol format its endpoint expects from baseAsset + quoteAsset:
 *   - concatenated:   `${baseAsset}${quoteAsset}`  → e.g. "sxWETHsxIDRX"
 *   - slash-separated: `${baseAsset}/${quoteAsset}` → e.g. "sxWETH/sxIDRX"
 */
export interface MarketInfo {
  poolId: string;
  baseAsset: string;
  quoteAsset: string;
  baseDecimals: number;
  quoteDecimals: number;
}

/** Derive the concatenated symbol used by most trading API endpoints */
export function toSymbol(market: MarketInfo): string {
  return `${market.baseAsset}${market.quoteAsset}`;
}

/** Derive the slash-separated display symbol */
export function toDisplaySymbol(market: MarketInfo): string {
  return `${market.baseAsset}/${market.quoteAsset}`;
}

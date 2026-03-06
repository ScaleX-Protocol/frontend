export const parseCurrency = (value: string) => {
  return parseFloat(value.replace(/[$,]/g, '') || '0');
};

/**
 * Derives a LendingSummary from the raw dashboard response.
 *
 * Used when the indexer does not return a `summary` field (Solana devnet).
 * All dollar-formatted strings (e.g. "$384.00") are parsed with parseCurrency.
 */
export function deriveLendingSummary(data: {
  supplies: Array<{ currentValue: string; earnings: string; apy: string }>;
  borrows: Array<{ currentDebt: string }>;
  availableToBorrow: Array<{ availableAmount: string }>;
}): import('../types/lending.types').LendingSummary {
  const totalSupplied = data.supplies
    .reduce((sum, s) => sum + parseCurrency(s.currentValue), 0)
    .toFixed(2);

  const totalBorrowed = data.borrows
    .reduce((sum, b) => sum + parseCurrency(b.currentDebt), 0)
    .toFixed(2);

  const totalEarnings = data.supplies
    .reduce((sum, s) => sum + parseCurrency(s.earnings), 0)
    .toFixed(2);

  // Borrowing power = sum of per-asset available amounts (already in USD)
  const borrowingPower = data.availableToBorrow
    .reduce((sum, a) => sum + parseCurrency(a.availableAmount), 0)
    .toFixed(2);

  // Health factor is ∞ when there are no borrows (use numeric string for parseFloat compatibility)
  const healthFactor = data.borrows.length === 0 ? '999999' : '1.00';

  // Net APY: simple average of supply APYs (strips trailing %)
  const netAPY = data.supplies.length > 0
    ? (data.supplies.reduce((sum, s) => sum + parseCurrency(s.apy), 0) / data.supplies.length).toFixed(2) + '%'
    : '0.00%';

  return { totalSupplied, totalBorrowed, netAPY, totalEarnings, healthFactor, borrowingPower };
}

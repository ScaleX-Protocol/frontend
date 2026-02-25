/**
 * Format a numeric value to compact format with K/M suffix for large numbers
 * @param value - The value to format (as string or number)
 * @returns Formatted string like "$1.5k" or "$2.3M"
 */
export function formatCompactValue(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "$0";

  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}k`;
  }

  return `$${num.toFixed(2)}`;
}

/**
 * Format liquidity value with appropriate suffix and asset name
 * @param value - The liquidity value (as string with possible $ and commas)
 * @param asset - The asset symbol
 * @returns Object with formatted and full amount
 */
export function formatLiquidity(
  value: string | undefined,
  asset: string,
): { formatted: string; amount: string } {
  if (!value) return { formatted: "0", amount: "0" };

  const num = parseFloat(value.replace(/[$,]/g, ""));

  if (isNaN(num)) return { formatted: "0", amount: "0" };

  if (num >= 1000000) {
    return {
      formatted: `${(num / 1000000).toFixed(2)}M ${asset}`,
      amount: num.toLocaleString(),
    };
  } else if (num >= 1000) {
    return {
      formatted: `${Math.floor(num).toLocaleString()} ${asset}`,
      amount: num.toLocaleString(),
    };
  }

  return {
    formatted: `${num.toFixed(0)} ${asset}`,
    amount: num.toString(),
  };
}

/**
 * Calculate borrowing power utilization percentage
 * @param borrowed - Total borrowed amount
 * @param borrowingPower - Available borrowing power
 * @returns Utilization percentage (0-100)
 */
export function getBorrowingUtilization(
  borrowed: string,
  borrowingPower: string,
): number {
  const borrowedNum = parseFloat(borrowed || "0");
  const powerNum = parseFloat(borrowingPower || "0");

  if (powerNum <= 0) return 0;

  return Math.min((borrowedNum / (borrowedNum + powerNum)) * 100, 100);
}

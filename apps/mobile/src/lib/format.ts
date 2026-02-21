/**
 * Format price with appropriate decimal places
 * @param price - Price value to format
 * @param decimals - Number of decimal places (default: auto)
 * @returns Formatted price string
 */
export function formatPrice(price: number | string, decimals?: number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return '$0.00';
  }

  // Auto-determine decimal places based on price magnitude
  let displayDecimals = decimals;
  if (displayDecimals === undefined) {
    if (numPrice >= 1000) {
      displayDecimals = 2;
    } else if (numPrice >= 1) {
      displayDecimals = 4;
    } else if (numPrice >= 0.01) {
      displayDecimals = 6;
    } else {
      displayDecimals = 8;
    }
  }

  return `$${numPrice.toLocaleString('en-US', {
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
  })}`;
}

/**
 * Format percentage change
 * @param value - Percentage value
 * @returns Formatted percentage string with sign
 */
export function formatPercentage(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0.00%';
  }

  const sign = numValue >= 0 ? '+' : '';
  return `${sign}${numValue.toFixed(2)}%`;
}

/**
 * Format volume to human-readable format
 * @param volume - Volume value
 * @returns Formatted volume string
 */
export function formatVolume(volume: number | string): string {
  const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;

  if (isNaN(numVolume)) {
    return '$0';
  }

  if (numVolume >= 1000000) {
    return `$${(numVolume / 1000000).toFixed(2)}M`;
  } else if (numVolume >= 1000) {
    return `$${(numVolume / 1000).toFixed(2)}K`;
  }

  return `$${numVolume.toFixed(2)}`;
}

/**
 * Format currency value with proper decimals
 * @param value - Currency value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string, decimals: number = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '$0.00';
  }

  return `$${numValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format symbol for API calls by adding slash separator
 * Converts from sxWETHsxIDRX to sxWETH/sxIDRX
 * @param symbol - Symbol to format (e.g., sxWETHsxIDRX)
 * @returns Formatted symbol with slash (e.g., sxWETH/sxIDRX)
 */
export function formatSymbolForAPI(symbol: string): string {
  // If symbol already has a slash, return as-is
  if (symbol.includes('/')) {
    return symbol;
  }

  // Find the second occurrence of 'sx' to split base and quote assets
  const firstSxIndex = symbol.indexOf('sx');
  if (firstSxIndex === -1) {
    return symbol;
  }

  const secondSxIndex = symbol.indexOf('sx', firstSxIndex + 2);
  if (secondSxIndex === -1) {
    return symbol;
  }

  // Split at the second 'sx' and insert slash
  const baseAsset = symbol.substring(0, secondSxIndex);
  const quoteAsset = symbol.substring(secondSxIndex);

  return `${baseAsset}/${quoteAsset}`;
}

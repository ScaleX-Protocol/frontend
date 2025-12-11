/**
 * Centralized Formatting Utilities
 * Consolidates all formatting logic from scattered utility files
 */

import { formatUnits, parseUnits } from 'viem';
import { isValidAddress } from './validation';

// Token and currency formatting
export function formatTokenAmount(
  amount: bigint | string | number,
  decimals: number,
  symbol?: string,
  options: {
    maxDecimals?: number;
    minDecimals?: number;
    showSymbol?: boolean;
    compact?: boolean;
  } = {}
): string {
  try {
    let numericAmount: bigint;

    if (typeof amount === 'bigint') {
      numericAmount = amount;
    } else if (typeof amount === 'string') {
      numericAmount = parseUnits(amount, decimals);
    } else {
      numericAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    }

    const formatted = formatUnits(numericAmount, decimals);
    const numValue = parseFloat(formatted);

    const {
      maxDecimals = decimals,
      minDecimals = 0,
      showSymbol = true,
      compact = false
    } = options;

    let displayValue = numValue.toFixed(maxDecimals);

    // Remove trailing zeros
    if (maxDecimals > 0) {
      displayValue = parseFloat(displayValue).toFixed(Math.max(minDecimals,
        displayValue.replace(/\.?0+$/, '').split('.')[1]?.length || 0));
    }

    // Compact formatting for large numbers
    if (compact && numValue >= 1000) {
      const compactValue = numValue >= 1000000
        ? `${(numValue / 1000000).toFixed(1)}M`
        : `${(numValue / 1000).toFixed(1)}K`;

      displayValue = compactValue.replace(/\.0$/, '');
    }

    return showSymbol && symbol ? `${displayValue} ${symbol}` : displayValue;
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return options.showSymbol && symbol ? `0 ${symbol}` : '0';
  }
}

export function formatBalance(
  balance: bigint | string | number,
  decimals: number = 18,
  symbol?: string,
  options?: Parameters<typeof formatTokenAmount>[3]
): string {
  return formatTokenAmount(balance, decimals, symbol, {
    maxDecimals: Math.min(6, decimals),
    minDecimals: 2,
    ...options
  });
}

export function formatPrice(
  price: number | string,
  currency: string = 'USD',
  options: {
    maxDecimals?: number;
    showCurrency?: boolean;
    compact?: boolean;
  } = {}
): string {
  try {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numPrice)) return '$0.00';

    const {
      maxDecimals = numPrice < 1 ? 6 : 2,
      showCurrency = true,
      compact = false
    } = options;

    let displayValue: string;

    if (compact && numPrice >= 1000) {
      displayValue = numPrice >= 1000000
        ? `${(numPrice / 1000000).toFixed(1)}M`
        : `${(numPrice / 1000).toFixed(1)}K`;
      displayValue = displayValue.replace(/\.0$/, '');
    } else {
      displayValue = numPrice.toFixed(maxDecimals);
    }

    return showCurrency ? `$${displayValue}` : displayValue;
  } catch (error) {
    console.error('Error formatting price:', error);
    return '$0.00';
  }
}

// Transaction and address formatting
export function formatTransactionHash(
  hash: string,
  options: {
    length?: number;
    showPrefix?: boolean;
  } = {}
): string {
  const { length = 6, showPrefix = true } = options;

  if (!hash) return 'N/A';

  if (hash.length <= length * 2 + 2) {
    return showPrefix ? hash : hash.slice(2);
  }

  const start = showPrefix ? hash.slice(0, length + 2) : hash.slice(2, length + 2);
  const end = hash.slice(-length);

  return `${start}...${end}`;
}

export function formatAddress(
  address: string,
  options: {
    length?: number;
    showPrefix?: boolean;
  } = {}
): string {
  if (!isValidAddress(address)) {
    return 'Invalid Address';
  }

  return formatTransactionHash(address, options);
}

// Time and date formatting
export function formatTime(
  timestamp: string | number | Date,
  options: {
    format?: 'short' | 'medium' | 'long';
    includeTime?: boolean;
  } = {}
): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const { format = 'medium', includeTime = true } = options;

    const dateTimeOptions: Intl.DateTimeFormatOptions = {
      year: format === 'short' ? '2-digit' : 'numeric',
      month: format === 'short' ? '2-digit' : 'short',
      day: '2-digit',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        second: format === 'long' ? '2-digit' : undefined
      })
    };

    return date.toLocaleString('en-US', dateTimeOptions);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Date';
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

export function formatCooldown(cooldownSeconds: number): string {
  const now = Date.now();
  const cooldownEnd = now + (cooldownSeconds * 1000);
  const remaining = Math.max(0, cooldownEnd - now);

  if (remaining === 0) return 'Available now';

  return `Available in ${formatDuration(Math.ceil(remaining / 1000))}`;
}

// Percentage and health factor formatting
export function formatPercent(
  value: number,
  options: {
    maxDecimals?: number;
    showSymbol?: boolean;
    colorCode?: boolean;
  } = {}
): string {
  const {
    maxDecimals = 2,
    showSymbol = true,
    colorCode = false
  } = options;

  const formatted = `${value.toFixed(maxDecimals)}${showSymbol ? '%' : ''}`;

  if (colorCode) {
    if (value < 0) return `🔴 ${formatted}`;
    if (value > 0) return `🟢 ${formatted}`;
    return `⚪ ${formatted}`;
  }

  return formatted;
}

export function formatHealthFactor(healthFactor: number | string | bigint): string {
  const value = typeof healthFactor === 'bigint'
    ? parseFloat(healthFactor.toString()) / 1e18
    : typeof healthFactor === 'string'
    ? parseFloat(healthFactor)
    : healthFactor;

  if (isNaN(value) || value <= 0) return '⚠️ At Risk';
  if (value < 1.1) return '🔴 Low';
  if (value < 1.5) return '🟡 Medium';
  return `🟢 ${value.toFixed(2)}`;
}

// Number formatting utilities
export function formatNumber(
  num: number | string,
  options: {
    maxDecimals?: number;
    thousandSeparator?: boolean;
    compact?: boolean;
  } = {}
): string {
  try {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '0';

    const {
      maxDecimals = 2,
      thousandSeparator = true,
      compact = false
    } = options;

    if (compact && value >= 1000) {
      return value >= 1000000
        ? `${(value / 1000000).toFixed(1)}M`
        : `${(value / 1000).toFixed(1)}K`;
    }

    const formatted = value.toFixed(maxDecimals);
    return thousandSeparator ? formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatted;
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
}

// Symbol and asset formatting
export function formatSymbol(symbol: string): string {
  if (!symbol) return 'UNKNOWN';
  return symbol.toUpperCase().trim();
}

export function formatAssetPair(baseAsset: string, quoteAsset: string): string {
  return `${formatSymbol(baseAsset)}/${formatSymbol(quoteAsset)}`;
}
import {
  formatTokenAmount,
  formatPrice as formatPriceCore,
  formatNumber
} from '@scalex/base-utils';

// Backward compatibility wrapper for formatAmount
export const formatAmount = (value: string, decimals: number = 18) => {
  const num = parseFloat(value) / 10 ** decimals;
  return num.toFixed(decimals === 18 ? 4 : 2);
};

// Backward compatibility wrapper for formatPrice
export const formatPrice = (value: string, decimals: number = 6) => {
  const num = parseFloat(value) / 10 ** decimals;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper function to calculate total
export const calculateTotal = (price: string, qty: string) => {
  const priceNum = parseFloat(price) / 10 ** 9;
  const qtyNum = parseFloat(qty) / 10 ** 18;
  return formatNumber(priceNum * qtyNum, { maxDecimals: 2 });
};

// Additional utility functions
export const formatPriceForOrderBook = (price: string, decimals: number = 6) => {
  const num = parseFloat(price) / 10 ** decimals;
  return num.toFixed(decimals);
};

export const formatQuantity = (quantity: string, decimals: number = 18) => {
  const num = parseFloat(quantity) / 10 ** decimals;
  return num.toFixed(decimals === 18 ? 4 : 2);
};

export const getPrecision = (value: string): number => {
  const num = parseFloat(value);
  if (num === 0) return 2;
  return Math.max(2, 8 - Math.floor(Math.log10(Math.abs(num))));
};

export const getSideClass = (side: 'buy' | 'sell'): string => {
  return side === 'buy' ? 'text-green-600' : 'text-red-600';
};

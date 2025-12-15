import {
  formatTokenAmount,
  formatPrice as formatPriceCore,
  formatTime as formatTimeCore,
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

// Backward compatibility wrapper for formatTime
export const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// Helper function to calculate total
export const calculateTotal = (price: string, qty: string) => {
  const priceNum = parseFloat(price) / 10 ** 9;
  const qtyNum = parseFloat(qty) / 10 ** 18;
  return formatNumber(priceNum * qtyNum, { maxDecimals: 2 });
};

// Helper function to calculate fee (assuming 0.1% trading fee)
export const calculateFee = (price: string, qty: string, feeRate: number = 0.001) => {
  const priceNum = parseFloat(price) / 10 ** 9;
  const qtyNum = parseFloat(qty) / 10 ** 18;
  const total = priceNum * qtyNum;
  return formatNumber(total * feeRate, { maxDecimals: 4 });
};

export const formaterAsset = (value: number, decimals: number) => {
  return value / 10 ** decimals;
}
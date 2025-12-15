// Trading utilities
import { formatUnits } from 'viem';

export function formatAmount(amount: bigint | number, decimals: number = 18): string {
  if (typeof amount === 'number') {
    return (amount / 10 ** decimals).toFixed(4);
  }
  return formatUnits(amount, decimals);
}

export function formatPrice(price: string | number, decimals: number = 6): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toFixed(decimals);
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export function calculatePriceImpact(currentPrice: number, targetPrice: number): number {
  return ((targetPrice - currentPrice) / currentPrice) * 100;
}

export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

export function parseContractError(error: any): Error {
  if (!error) {
    return new Error('Unknown error');
  }
  return new Error(error.message || 'Transaction failed');
}

export function createInterceptedWalletClient() {
  // Placeholder for wallet client creation
  return null;
}
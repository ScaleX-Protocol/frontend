import { formatUnits } from 'viem';

export const parseCurrency = (value: string) => {
  return parseFloat(value.replace(/[$,]/g, '') || '0');
};

// Format token amount for display
export function formatTokenAmount(amount: bigint | undefined, decimals: number, symbol?: string): string {
  if (!amount) return '0';
  const formatted = formatUnits(amount, decimals);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

// Parse contract errors
export function parseContractError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error('Unknown error occurred');
}

// Validate withdraw parameters
export function validateWithdrawParams(params: { tokenAddress: string; amount: string; decimals: number }) {
  if (!params.tokenAddress) {
    return { isValid: false, error: 'Token address is required' };
  }
  if (!params.amount || parseFloat(params.amount) <= 0) {
    return { isValid: false, error: 'Invalid amount: must be greater than 0' };
  }
  if (!params.decimals || params.decimals < 0) {
    return { isValid: false, error: 'Invalid decimals' };
  }
  return { isValid: true };
}

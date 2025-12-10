import { formatUnits, parseUnits } from 'viem';

// Error handling utilities
export class BorrowError extends Error {
  constructor(
    message: string,
    public code?: string,
    public txHash?: string
  ) {
    super(message);
    this.name = 'BorrowError';
  }
}

export const ERROR_CODES = {
  INSUFFICIENT_COLLATERAL: 'INSUFFICIENT_COLLATERAL',
  BORROW_CAP_EXCEEDED: 'BORROW_CAP_EXCEEDED',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  USER_REJECTED: 'USER_REJECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  LENDING_MANAGER_NOT_SET: 'LENDING_MANAGER_NOT_SET',
} as const;

export function parseContractError(error: any): BorrowError {
  if (!error) {
    return new BorrowError('Unknown error occurred', ERROR_CODES.TRANSACTION_FAILED);
  }

  // Parse common contract errors
  const message = error.message || error.data?.message || String(error);

  if (message.includes('InsufficientCollateral') || message.includes('Insufficient collateral')) {
    return new BorrowError(
      'Insufficient collateral for this borrow',
      ERROR_CODES.INSUFFICIENT_COLLATERAL
    );
  }

  if (message.includes('BorrowCapExceeded')) {
    return new BorrowError(
      'Borrow cap exceeded for this asset',
      ERROR_CODES.BORROW_CAP_EXCEEDED
    );
  }

  if (message.includes('User denied') || message.includes('rejected')) {
    return new BorrowError(
      'Transaction was rejected by user',
      ERROR_CODES.USER_REJECTED
    );
  }

  if (message.includes('LendingManagerNotSet')) {
    return new BorrowError(
      'Lending manager not configured',
      ERROR_CODES.LENDING_MANAGER_NOT_SET
    );
  }

  if (message.includes('BorrowFailed')) {
    return new BorrowError(
      'Borrow transaction failed',
      ERROR_CODES.TRANSACTION_FAILED
    );
  }

  if (message.includes('amount')) {
    return new BorrowError(
      'Invalid borrow amount',
      ERROR_CODES.INVALID_AMOUNT
    );
  }

  return new BorrowError(
    message || 'Transaction failed',
    ERROR_CODES.TRANSACTION_FAILED,
    error.hash
  );
}

// Token utilities
export function validateTokenAmount(
  amount: string,
  decimals: number,
  maxAmount?: bigint
): { isValid: boolean; error?: string; amountInWei?: bigint } {
  // Check if amount is a valid number
  if (!amount || isNaN(Number(amount))) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }

  if (Number(amount) <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  try {
    const amountInWei = parseUnits(amount, decimals);

    // Check against max amount if provided
    if (maxAmount && amountInWei > maxAmount) {
      return {
        isValid: false,
        error: `Amount exceeds maximum borrowable. Max: ${formatUnits(maxAmount, decimals)}`
      };
    }

    return { isValid: true, amountInWei };
  } catch (error) {
    return { isValid: false, error: 'Invalid amount format' };
  }
}

// Transaction utilities
export function formatTransactionHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function getExplorerUrl(hash: string, chainId: number = 84532): string {
  const explorers: Record<number, string> = {
    84532: 'https://sepolia.basescan.org',
    31337: 'http://localhost:8545', // Local development
  };

  const baseUrl = explorers[chainId] || explorers[31337];
  return `${baseUrl}/tx/${hash}`;
}

// Borrow validation
export function validateBorrowParams(params: {
  tokenAddress: string;
  amount: string;
  decimals: number;
  user?: string;
}): { isValid: boolean; error?: string } {
  const { tokenAddress, amount, decimals, user } = params;

  // Validate token address
  if (!tokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    return { isValid: false, error: 'Invalid token address' };
  }

  // Validate amount
  const amountValidation = validateTokenAmount(amount, decimals);
  if (!amountValidation.isValid) {
    return { isValid: false, error: amountValidation.error };
  }

  // Validate user
  if (!user || !/^0x[a-fA-F0-9]{40}$/.test(user)) {
    return { isValid: false, error: 'Invalid user address' };
  }

  return { isValid: true };
}

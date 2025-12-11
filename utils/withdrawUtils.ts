import { formatUnits, parseUnits, parseContractError as parseGenericContractError, validateTokenAmount as validateTokenAmountGeneric, formatTransactionHash as formatHash, getExplorerUrl as getExplorerUrlGeneric, formatTokenAmount as formatTokenAmountCentralized } from '../src/core/utils';

// Error handling utilities
export class WithdrawError extends Error {
  constructor(
    message: string,
    public code?: keyof typeof ERROR_CODES | string,
    public txHash?: string
  ) {
    super(message);
    this.name = 'WithdrawError';
  }
}

export const ERROR_CODES = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  USER_REJECTED: 'USER_REJECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export function parseContractError(error: any): WithdrawError {
  // Use centralized error parsing
  const genericError = parseGenericContractError(error);

  // Convert to WithdrawError with domain-specific handling
  const message = genericError.message || error?.message || 'Unknown error occurred';

  // Handle withdraw-specific errors first
  if (message.includes('InsufficientBalance')) {
    return new WithdrawError(
      'Insufficient balance for this withdrawal',
      ERROR_CODES.INSUFFICIENT_BALANCE,
      genericError.transaction?.hash
    );
  }

  if (message.includes('OnlyBurner')) {
    return new WithdrawError(
      'BalanceManager is not authorized to burn synthetic tokens. Please contact support.',
      ERROR_CODES.TRANSACTION_FAILED,
      genericError.transaction?.hash
    );
  }

  if (message.includes('OnlyMinter')) {
    return new WithdrawError(
      'BalanceManager is not authorized to mint synthetic tokens. Please contact support.',
      ERROR_CODES.TRANSACTION_FAILED,
      genericError.transaction?.hash
    );
  }

  if (message.includes('ZeroAddress') || message.includes('invalid address') || message.includes('InvalidAddress')) {
    return new WithdrawError(
      'Invalid wallet address',
      ERROR_CODES.CONTRACT_NOT_FOUND,
      genericError.transaction?.hash
    );
  }

  // Map generic error codes to withdraw-specific ones
  let errorCode: keyof typeof ERROR_CODES | string = ERROR_CODES.TRANSACTION_FAILED;
  if (genericError.code === 'USER_REJECTED') {
    errorCode = ERROR_CODES.USER_REJECTED;
  } else if (genericError.code === 'INSUFFICIENT_FUNDS') {
    errorCode = ERROR_CODES.INSUFFICIENT_BALANCE;
  } else if (genericError.code === 'INVALID_AMOUNT') {
    errorCode = ERROR_CODES.INVALID_AMOUNT;
  }

  return new WithdrawError(message, errorCode, genericError.transaction?.hash);
}

// Token utilities
export function validateTokenAmount(
  amount: string,
  decimals: number,
  maxAmount?: bigint
): { isValid: boolean; error?: string; amountInWei?: bigint } {
  // Use centralized validation with withdraw-specific logic
  const result = validateTokenAmountGeneric(amount, decimals, 'WITHDRAW');

  if (!result.isValid) {
    return result;
  }

  try {
    const amountInWei = parseUnits(result.formattedAmount || amount, decimals);

    // Check against max amount if provided (withdraw-specific validation)
    if (maxAmount && amountInWei > maxAmount) {
      return {
        isValid: false,
        error: `Insufficient balance. Available: ${formatUnits(maxAmount, decimals)}`
      };
    }

    return { isValid: true, amountInWei };
  } catch (error) {
    return { isValid: false, error: 'Invalid amount format' };
  }
}

// Transaction utilities
export function formatTransactionHash(hash: string): string {
  // Use centralized formatting with withdraw-specific defaults
  return formatHash(hash, { length: 4, showPrefix: true });
}

export function getExplorerUrl(hash: string, chainId?: number): string {
  // Use centralized URL generation
  return getExplorerUrlGeneric('tx', hash, chainId);
}

// Withdraw validation
export function validateWithdrawParams(params: {
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

// Re-export centralized formatting utilities for backward compatibility
export { formatTokenAmountCentralized as formatTokenAmount };

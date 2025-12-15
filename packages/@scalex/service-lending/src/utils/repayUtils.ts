import {
  formatUnits,
  parseUnits,
  parseContractError as parseGenericContractError,
  validateTokenAmount as validateTokenAmountGeneric,
  formatTransactionHash as formatHash,
  getExplorerUrl as getExplorerUrl,
  formatTokenAmount as formatTokenAmountCentralized,
  ChainConfig
} from '@scalex/base-utils';

// Error handling utilities
export class RepayError extends Error {
  constructor(
    message: string,
    public code?: keyof typeof ERROR_CODES | string,
    public txHash?: string
  ) {
    super(message);
    this.name = 'RepayError';
  }
}

export const ERROR_CODES = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  NO_DEBT: 'NO_DEBT',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  USER_REJECTED: 'USER_REJECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  LENDING_MANAGER_NOT_SET: 'LENDING_MANAGER_NOT_SET',
} as const;

export function parseContractError(error: any): RepayError {
  // Use centralized error parsing
  const genericError = parseGenericContractError(error);

  // Convert to RepayError with domain-specific handling
  const message = genericError.message || error?.message || 'Unknown error occurred';

  // Handle repay-specific errors first
  if (message.includes('InsufficientBalance')) {
    return new RepayError(
      'Insufficient balance for this repayment',
      ERROR_CODES.INSUFFICIENT_BALANCE,
      genericError.transaction?.hash
    );
  }

  if (message.includes('NoDebt') || message.includes('No debt')) {
    return new RepayError(
      'No debt to repay',
      ERROR_CODES.NO_DEBT,
      genericError.transaction?.hash
    );
  }

  if (message.includes('LendingManagerNotSet')) {
    return new RepayError(
      'Lending manager not configured',
      ERROR_CODES.LENDING_MANAGER_NOT_SET,
      genericError.transaction?.hash
    );
  }

  if (message.includes('RepayFailed')) {
    return new RepayError(
      'Repay transaction failed',
      ERROR_CODES.TRANSACTION_FAILED,
      genericError.transaction?.hash
    );
  }

  if (message.includes('ZeroAddress') || message.includes('invalid address')) {
    return new RepayError(
      'Invalid wallet address',
      ERROR_CODES.CONTRACT_NOT_FOUND,
      genericError.transaction?.hash
    );
  }

  // Map generic error codes to repay-specific ones
  let errorCode: keyof typeof ERROR_CODES | string = ERROR_CODES.TRANSACTION_FAILED;
  if (genericError.code === 'USER_REJECTED') {
    errorCode = ERROR_CODES.USER_REJECTED;
  } else if (genericError.code === 'INSUFFICIENT_FUNDS') {
    errorCode = ERROR_CODES.INSUFFICIENT_BALANCE;
  } else if (genericError.code === 'INVALID_AMOUNT') {
    errorCode = ERROR_CODES.INVALID_AMOUNT;
  }

  return new RepayError(message, errorCode, genericError.transaction?.hash);
}

// Token utilities
export function validateTokenAmount(
  amount: string,
  decimals: number,
  maxAmount?: bigint
): { isValid: boolean; error?: string; amountInWei?: bigint } {
  // Use centralized validation with repay-specific logic
  const result = validateTokenAmountGeneric(amount, decimals, 'REPAY');

  if (!result.isValid) {
    return result;
  }

  try {
    const amountInWei = parseUnits(result.formattedAmount || amount, decimals);

    // Check against max amount if provided (repay-specific validation)
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
  // Use centralized formatting with repay-specific defaults
  return formatHash(hash, { length: 4, showPrefix: true });
}

export function getExplorerUrlBase(hash: string, chainId?: number): string {
  // Use centralized URL generation
  return getExplorerUrl('tx', hash, DEFAULT_CHAIN_CONFIG, chainId);
}

// Repay validation
export function validateRepayParams(params: {
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
// Default chain config for Base Sepolia
const DEFAULT_CHAIN_CONFIG: ChainConfig = {
  defaultChainId: 84532,
  supportedChainIds: [84532],
  blockExplorers: {
    84532: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org'
    }
  }
};

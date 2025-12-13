import { formatUnits, parseUnits, parseContractError as parseGenericContractError, validateTokenAmount as validateTokenAmountGeneric, formatTransactionHash as formatHash, getExplorerUrl as getExplorerUrlGeneric, formatTokenAmount as formatTokenAmountCentralized } from '@/core/utils';

// Error handling utilities
export class DepositError extends Error {
  constructor(
    message: string,
    public code?: keyof typeof ERROR_CODES | string,
    public txHash?: string
  ) {
    super(message);
    this.name = 'DepositError';
  }
}

export const ERROR_CODES = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  USER_REJECTED: 'USER_REJECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export function parseContractError(error: any): DepositError {
  // Use centralized error parsing first
  const genericError = parseGenericContractError(error);

  // Convert to DepositError with deposit-specific error codes
  const message = genericError.message || 'Unknown error occurred';
  let code: keyof typeof ERROR_CODES | string = ERROR_CODES.TRANSACTION_FAILED;

  if (genericError.code === 'INSUFFICIENT_FUNDS') {
    code = ERROR_CODES.INSUFFICIENT_BALANCE;
  } else if (genericError.code === 'USER_REJECTED') {
    code = ERROR_CODES.USER_REJECTED;
  } else if (message.includes('amount')) {
    code = ERROR_CODES.INVALID_AMOUNT;
  } else if (message.includes('ZeroAddress') || message.includes('invalid address')) {
    code = ERROR_CODES.CONTRACT_NOT_FOUND;
  }

  return new DepositError(message, code, genericError.transaction?.hash);
}

// Token utilities - wrapper around centralized validation with deposit-specific logic
export function validateTokenAmount(
  amount: string,
  decimals: number,
  maxAmount?: bigint
): { isValid: boolean; error?: string; amountInWei?: bigint } {
  // Use centralized validation
  const validation = validateTokenAmountGeneric(amount, decimals, 'TEMP');

  if (!validation.isValid) {
    return { isValid: false, error: validation.error };
  }

  try {
    const amountInWei = parseUnits(validation.formattedAmount || amount, decimals);

    // Check against max amount if provided
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

// Transaction utilities - wrappers around centralized functions
export function formatTransactionHash(hash: string): string {
  return formatHash(hash, { length: 5 });
}

export function getExplorerUrl(hash: string, chainId: number = 84532): string {
  return getExplorerUrlGeneric('tx', hash, chainId);
}

// Gas estimation utilities
export function estimateGasFee(
  gasLimit: bigint,
  gasPrice: bigint,
  decimals: number = 18
): string {
  const gasFee = gasLimit * gasPrice;
  return formatUnits(gasFee, decimals);
}

// Token list with validation
export const SUPPORTED_TOKENS = [
  {
    address: '0x0000000000000000000000000000000000000000' as const,
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true,
  },
  {
    address: '0x036CbD53842c5426634d7926b90d857C835a21FB' as const,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    isNative: false,
  },
  // Add more tokens as they become available
] as const;

export function getTokenByAddress(address: string) {
  return SUPPORTED_TOKENS.find(token =>
    token.address.toLowerCase() === address.toLowerCase()
  );
}

export function getTokenBySymbol(symbol: string) {
  return SUPPORTED_TOKENS.find(token =>
    token.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

// Deposit validation
export function validateDepositParams(params: {
  tokenAddress: string;
  amount: string;
  decimals: number;
  recipient?: string;
}): { isValid: boolean; error?: string } {
  const { tokenAddress, amount, decimals, recipient } = params;

  // Validate token address
  if (!tokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    return { isValid: false, error: 'Invalid token address' };
  }

  // Validate amount
  const amountValidation = validateTokenAmount(amount, decimals);
  if (!amountValidation.isValid) {
    return { isValid: false, error: amountValidation.error };
  }

  // Validate recipient
  if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    return { isValid: false, error: 'Invalid recipient address' };
  }

  return { isValid: true };
}

// Re-export formatTokenAmount for backward compatibility
export { formatTokenAmountCentralized as formatTokenAmount };
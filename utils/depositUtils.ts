import { formatUnits, parseUnits } from 'viem';

// Error handling utilities
export class DepositError extends Error {
  constructor(
    message: string,
    public code?: string,
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
  if (!error) {
    return new DepositError('Unknown error occurred', ERROR_CODES.TRANSACTION_FAILED);
  }

  // Parse common contract errors
  const message = error.message || error.data?.message || String(error);

  if (message.includes('InsufficientBalance')) {
    return new DepositError(
      'Insufficient balance for this transaction',
      ERROR_CODES.INSUFFICIENT_BALANCE
    );
  }

  if (message.includes('User denied') || message.includes('rejected')) {
    return new DepositError(
      'Transaction was rejected by user',
      ERROR_CODES.USER_REJECTED
    );
  }

  if (message.includes('ZeroAddress') || message.includes('invalid address')) {
    return new DepositError(
      'Invalid wallet address',
      ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  if (message.includes('amount')) {
    return new DepositError(
      'Invalid deposit amount',
      ERROR_CODES.INVALID_AMOUNT
    );
  }

  return new DepositError(
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
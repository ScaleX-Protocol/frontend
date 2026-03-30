/**
 * Centralized Web3 Utilities
 * Consolidates all Web3-specific utilities from scattered files
 */

import { Chain } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import { ChainConfig } from '@/configs/chain';

// Explorer URL generation
export function getExplorerUrl(
  type: 'tx' | 'address' | 'block',
  value: string,
  chainId?: number
): string {
  const targetChainId = chainId || ChainConfig.defaultChainId;
  const explorer = ChainConfig.blockExplorers[targetChainId];

  if (!explorer) {
    console.warn(`No block explorer configured for chain ID ${targetChainId}`);
    return '#';
  }

  switch (type) {
    case 'tx':
      return `${explorer.url}/tx/${value}`;
    case 'address':
      return `${explorer.url}/address/${value}`;
    case 'block':
      return `${explorer.url}/block/${value}`;
    default:
      return explorer.url;
  }
}

export function getTransactionUrl(txHash: string, chainId?: number): string {
  return getExplorerUrl('tx', txHash, chainId);
}

export function getAddressUrl(address: string, chainId?: number): string {
  return getExplorerUrl('address', address, chainId);
}

export function getBlockUrl(blockNumber: string | number, chainId?: number): string {
  return getExplorerUrl('block', blockNumber.toString(), chainId);
}

// Chain utilities
export function parseChainId(chainId: string | number): number {
  if (typeof chainId === 'number') {
    return chainId;
  }

  const parsed = parseInt(chainId, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }

  return parsed;
}

export function isSupportedChain(chainId: number): boolean {
  return ChainConfig.supportedChainIds.includes(chainId);
}

export function getChainName(chainId: number): string {
  const explorer = ChainConfig.blockExplorers[chainId];
  return explorer?.name || `Chain ${chainId}`;
}

// Transaction formatting
export function formatTransactionHash(hash: string, options: {
  length?: number;
  showPrefix?: boolean;
  explorerUrl?: boolean;
  chainId?: number;
} = {}): string {
  const { length = 6, showPrefix = true, explorerUrl = false, chainId } = options;

  if (!hash) return 'N/A';

  if (hash.length <= length * 2 + 2) {
    return showPrefix ? hash : hash.slice(2);
  }

  const shortHash = formatTransactionHash(hash, { length, showPrefix });

  if (explorerUrl) {
    const fullUrl = getTransactionUrl(hash, chainId);
    return `[${shortHash}](${fullUrl})`;
  }

  return shortHash;
}

// Contract error parsing (generic version)
export class ContractError extends Error {
  constructor(
    message: string,
    public code?: string,
    public data?: any,
    public transaction?: {
      hash?: string;
      to?: string;
      from?: string;
    }
  ) {
    super(message);
    this.name = 'ContractError';
  }
}

export function parseContractError(error: any): ContractError {
  // Handle different error types
  if (!error) {
    return new ContractError('Unknown error');
  }

  // If it's already a ContractError, return it
  if (error instanceof ContractError) {
    return error;
  }

  // Parse error based on common patterns
  let message = 'Unknown error occurred';
  let code: string | undefined;
  let data: any;

  // MetaMask/Provider errors
  if (error.message) {
    message = error.message;
  }

  // Ethereum transaction errors
  if (error.data) {
    data = error.data;
  }

  if (error.code) {
    code = error.code.toString();
  }

  // Transaction reverted errors
  if (error.data && typeof error.data === 'string') {
    if (error.data.startsWith('0x')) {
      try {
        // This would require ABI decoding in a real implementation
        message = 'Transaction reverted';
      } catch {
        // Keep original message
      }
    }
  }

  // RPC errors
  if (error.error && error.error.message) {
    message = error.error.message;
  }

  // User rejection
  if (message.includes('rejected') || message.includes('denied') || message.includes('cancelled')) {
    message = 'Transaction was rejected by user';
    code = 'USER_REJECTED';
  }

  // Insufficient funds
  if (message.includes('insufficient funds') || message.includes('balance too low')) {
    message = 'Insufficient balance for this transaction';
    code = 'INSUFFICIENT_FUNDS';
  }

  // Gas issues
  if (message.includes('gas') && message.includes('exceeded')) {
    message = 'Gas limit exceeded';
    code = 'GAS_EXCEEDED';
  }

  return new ContractError(message, code, data, {
    hash: error.transactionHash,
    to: error.to,
    from: error.from
  });
}

// Gas utilities
export interface GasEstimate {
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
  estimatedCostUsd?: string;
}

export function estimateGasCost(
  gasLimit: number,
  gasPrice?: bigint,
  ethPrice?: number
): GasEstimate {
  const gasLimitStr = gasLimit.toString();
  let estimatedCost: string;

  if (gasPrice) {
    const costWei = BigInt(gasLimit) * gasPrice;
    estimatedCost = costWei.toString();

    return {
      gasLimit: gasLimitStr,
      gasPrice: gasPrice.toString(),
      estimatedCost,
      estimatedCostUsd: ethPrice
        ? `$${(Number(formatUnits(costWei, 18)) * ethPrice).toFixed(2)}`
        : undefined
    };
  }

  return {
    gasLimit: gasLimitStr,
    estimatedCost: '0'
  };
}

// Address utilities
export function normalizeAddress(address: string): string {
  if (!address) return '';

  // Remove 0x prefix if present
  const hexAddress = address.startsWith('0x') ? address.slice(2) : address;

  // Pad with leading zeros if necessary
  const paddedAddress = hexAddress.padStart(40, '0');

  // Add 0x prefix and lowercase
  return `0x${paddedAddress.toLowerCase()}`;
}

export function checksumAddress(address: string): string {
  // This is a simplified version - in production, you'd use viem's getAddress
  try {
    return address; // Would use: return getAddress(address);
  } catch {
    return address;
  }
}

// Token utilities
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export function createToken(address: string, symbol: string, decimals: number = 18): TokenInfo {
  return {
    address: normalizeAddress(address),
    symbol: symbol.toUpperCase(),
    name: symbol,
    decimals,
    logoURI: undefined
  };
}

// Network utilities
export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 5:
      return 'Goerli Testnet';
    case 11155111:
      return 'Sepolia Testnet';
    case 137:
      return 'Polygon Mainnet';
    case 80001:
      return 'Mumbai Testnet';
    case 56:
      return 'BSC Mainnet';
    case 97:
      return 'BSC Testnet';
    case 8453:
      return 'Base Mainnet';
    case 84532:
      return 'Base Sepolia';
    default:
      return `Chain ${chainId}`;
  }
}

export function isTestnet(chainId: number): boolean {
  const testnetChains = [5, 11155111, 80001, 97, 84532];
  return testnetChains.includes(chainId);
}

// EIP standards
export function isERC20Transfer(data: string): boolean {
  return (
    data.startsWith('0xa9059cbb') && // transfer method signature
    data.length === 138 // transfer has exactly 68 bytes (32 + 32)
  );
}

export function parseERC20Transfer(data: string): {
  to: string;
  amount: string;
} | null {
  if (!isERC20Transfer(data)) return null;

  const to = '0x' + data.slice(34, 74);
  const amount = '0x' + data.slice(74, 138);

  return {
    to: to.toLowerCase(),
    amount
  };
}

// ─── Contract error translation ───────────────────────────────────────────────

const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  // OrderBook errors
  OrderHasNoLiquidity:
    "The order book is empty — no one is on the other side of this trade. Try placing a limit order to queue your price.",
  SlippageTooHigh:
    "Price moved too much while your order was processing. Try a smaller amount or wait for the market to stabilize.",
  SlippageExceeded:
    "Price slipped beyond the acceptable range. Try a smaller order or increase your slippage tolerance.",
  FillOrKillNotFulfilled:
    "There wasn't enough liquidity to fill your entire order at once. Switch to GTC mode or try a smaller amount.",
  PostOnlyWouldTake:
    "Your price would have been filled immediately, which isn't allowed in Post-Only mode. Move your price further from the current market price.",
  TradingPaused: "Trading is temporarily paused. Please try again in a few minutes.",
  OrderTooSmall: "Order is too small — the minimum order value is 5 USDC. Increase your size or price.",
  OrderTooLarge: "Order exceeds the maximum allowed size. Please split it into smaller orders.",
  InvalidPrice: "Price must be greater than zero. Enter a valid price.",
  InvalidPriceIncrement:
    "Your price isn't on a valid tick size. Try rounding to the nearest whole number or valid increment.",
  InvalidQuantity: "Amount cannot be zero. Enter a valid quantity.",
  InvalidQuantityIncrement: "Your quantity isn't on the valid step size. Adjust the amount slightly.",
  NegativeSpreadCreated:
    "This limit order would cross the spread. For a buy order, set your price below the best ask. For a sell order, set your price above the best bid.",
  AutoRepayOnlyForBuyOrders: "Auto-Repay only works on buy orders. Disable Auto-Repay and try again.",
  NoDebtToRepay: "There is no debt to repay on this position.",
  AutoBorrowOnlyForSellOrders: "Auto-Borrow only works on sell orders. Disable Auto-Borrow and try again.",
  NoCollateralToBorrow: "No collateral available to borrow against. Deposit funds first.",
  UnauthorizedRouter: "This router is not authorized. Please contact support.",
  UnauthorizedCancellation: "You can only cancel your own orders.",
  OrderNotFound: "Order not found. It may have already been filled or cancelled.",
  // Balance errors
  InsufficientBalance:
    "Insufficient balance. Please deposit more funds, or enable Auto-Borrow if you have collateral.",
  InsufficientBalanceRequired: "Insufficient balance to cover this order. Please deposit more funds.",
  InsufficientSwapBalance: "Insufficient balance for this trade. Please deposit funds first.",
  ZeroAmount: "Amount cannot be zero. Enter a valid amount.",
  ERC20InsufficientAllowance:
    "You haven't approved enough tokens for this transaction. Please approve your tokens first.",
  ERC20InsufficientBalance: "Your wallet doesn't have enough tokens. Please check your balance.",
  SafeERC20FailedOperation: "Token transfer failed. The token contract may have rejected the operation.",
  // Lending errors
  InsufficientHealthFactorForBorrow:
    "Borrowing this amount would put your account at risk of liquidation. Reduce the borrow amount or add more collateral.",
  InsufficientHealthFactorForWithdraw:
    "Withdrawing this amount would put your account at risk of liquidation. Reduce the withdrawal amount.",
  InsufficientLiquidity: "The lending pool doesn't have enough liquidity right now. Try borrowing less.",
  InsufficientCollateral: "Not enough collateral to cover this borrow. Deposit more funds first.",
  InvalidAmount: "The amount entered is invalid. Please enter a positive number.",
  UnsupportedAsset: "This token is not supported for lending. Try a different asset.",
};

/** Walk viem's error chain up to maxDepth levels, extracting the contract error name */
function extractErrorName(error: unknown, depth = 0): string | undefined {
  if (depth > 10 || !error || typeof error !== 'object') return undefined;
  const err = error as Record<string, unknown>;

  // Prefer data.errorName (ContractFunctionRevertedError path)
  if (err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;
    if (typeof data.errorName === 'string' && data.errorName) return data.errorName;
  }

  // Then check .name (but skip generic viem wrapper names)
  const VIEM_WRAPPERS = new Set([
    'Error',
    'ContractFunctionRevertedError',
    'ContractFunctionExecutionError',
    'BaseError',
  ]);
  if (typeof err.name === 'string' && !VIEM_WRAPPERS.has(err.name)) {
    return err.name;
  }

  // Walk cause chain
  if (err.cause !== undefined) return extractErrorName(err.cause, depth + 1);
  return undefined;
}

/**
 * Translate any contract/viem error into a human-readable message.
 * Covers all 30+ ScaleX contract error types plus wallet-level errors.
 */
export function translateOrderError(error: unknown): string {
  if (!error) return 'An unknown error occurred. Please try again.';

  if (typeof error !== 'object' && typeof error !== 'string') {
    return 'An unexpected error occurred. Please try again.';
  }

  const err = (typeof error === 'object' ? error : {}) as Record<string, unknown>;
  const rawMessage = String(err.message ?? err.shortMessage ?? '');

  // User rejection takes highest priority
  if (
    rawMessage.includes('rejected') ||
    rawMessage.includes('denied') ||
    rawMessage.includes('User denied')
  ) {
    return 'Transaction cancelled. You rejected the transaction in your wallet.';
  }

  // Gas / native funds
  if (rawMessage.includes('insufficient funds')) {
    return 'Not enough ETH in your wallet to pay gas fees. Add ETH to continue.';
  }

  // Extract contract error name from error chain
  const errorName = extractErrorName(error);
  if (errorName && CONTRACT_ERROR_MESSAGES[errorName]) {
    return CONTRACT_ERROR_MESSAGES[errorName];
  }

  // Scan raw message string for known error names as last resort
  for (const [name, msg] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
    if (rawMessage.includes(name)) return msg;
  }

  return 'Transaction failed. Please check your balance and try again.';
}

// Re-export viem utilities
export { formatUnits, parseUnits } from 'viem';


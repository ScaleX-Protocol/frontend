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

// Re-export viem utilities
export { formatUnits, parseUnits } from 'viem';


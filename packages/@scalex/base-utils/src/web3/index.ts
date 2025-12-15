/**
 * Centralized Web3 Utilities
 * Consolidates all Web3-specific utilities from scattered files
 * Note: Chain configuration is passed as parameter to avoid circular dependencies
 */

import { formatUnits, parseUnits } from 'viem';

// Explorer URL generation
export interface ChainConfig {
  defaultChainId: number;
  supportedChainIds: number[];
  blockExplorers: Record<number, { name: string; url: string }>;
}

export function getExplorerUrl(
  type: 'tx' | 'address' | 'block',
  value: string,
  chainConfig: ChainConfig,
  chainId?: number
): string {
  const targetChainId = chainId || chainConfig.defaultChainId;
  const explorer = chainConfig.blockExplorers[targetChainId];

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

export function getTransactionUrl(txHash: string, chainConfig: ChainConfig, chainId?: number): string {
  return getExplorerUrl('tx', txHash, chainConfig, chainId);
}

export function getAddressUrl(address: string, chainConfig: ChainConfig, chainId?: number): string {
  return getExplorerUrl('address', address, chainConfig, chainId);
}

export function getBlockUrl(blockNumber: string | number, chainConfig: ChainConfig, chainId?: number): string {
  return getExplorerUrl('block', blockNumber.toString(), chainConfig, chainId);
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

export function isSupportedChain(chainId: number, chainConfig: ChainConfig): boolean {
  return chainConfig.supportedChainIds.includes(chainId);
}

export function getChainName(chainId: number, chainConfig: ChainConfig): string {
  const explorer = chainConfig.blockExplorers[chainId];
  return explorer?.name || `Chain ${chainId}`;
}

// Contract error parsing
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
  if (!error) {
    return new ContractError('Unknown error');
  }

  if (error instanceof ContractError) {
    return error;
  }

  let message = 'Unknown error occurred';
  let code: string | undefined;
  let data: any;

  if (error.message) {
    message = error.message;
  }

  if (error.data) {
    data = error.data;
  }

  if (error.code) {
    code = error.code.toString();
  }

  if (error.data && typeof error.data === 'string') {
    if (error.data.startsWith('0x')) {
      try {
        message = 'Transaction reverted';
      } catch {
        // Keep original message
      }
    }
  }

  if (error.error && error.error.message) {
    message = error.error.message;
  }

  if (message.includes('rejected') || message.includes('denied') || message.includes('cancelled')) {
    message = 'Transaction was rejected by user';
    code = 'USER_REJECTED';
  }

  if (message.includes('insufficient funds') || message.includes('balance too low')) {
    message = 'Insufficient balance for this transaction';
    code = 'INSUFFICIENT_FUNDS';
  }

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

  const hexAddress = address.startsWith('0x') ? address.slice(2) : address;
  const paddedAddress = hexAddress.padStart(40, '0');

  return `0x${paddedAddress.toLowerCase()}`;
}

export function checksumAddress(address: string): string {
  try {
    return address;
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
    data.startsWith('0xa9059cbb') &&
    data.length === 138
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

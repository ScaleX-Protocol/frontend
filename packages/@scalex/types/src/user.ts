/**
 * @scalex/types – User types
 * Shared user and account DTOs – chain-agnostic.
 */

export interface UserProfile {
  id: string;
  address: string;
  chainFamily: 'evm' | 'svm';
  chainId?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface UserBalance {
  tokenAddress: string;
  symbol: string;
  balance: string;
  decimals: number;
  chainId?: number;
}

export interface UserPosition {
  type: 'supply' | 'borrow' | 'liquidity';
  tokenAddress: string;
  amount: string;
  valueUsd?: string;
  chainId?: number;
}

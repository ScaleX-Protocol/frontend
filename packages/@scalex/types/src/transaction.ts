/**
 * @scalex/types – Transaction types
 * Shared DTOs for Deposit, Borrow, LimitOrder – chain-agnostic.
 */

export type TransactionKind = 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'limit_order' | 'market_order';

export interface DepositParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
  chainId?: number;
}

export interface DepositResult {
  txHash: string;
  success: boolean;
  blockNumber?: string;
}

export interface WithdrawParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
  chainId?: number;
}

export interface WithdrawResult {
  txHash: string;
  success: boolean;
  blockNumber?: string;
}

export interface BorrowParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
  chainId?: number;
}

export interface BorrowResult {
  txHash: string;
  success: boolean;
  blockNumber?: string;
}

export interface RepayParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
  chainId?: number;
}

export interface RepayResult {
  txHash: string;
  success: boolean;
  blockNumber?: string;
}

export type LimitOrderSide = 'buy' | 'sell';

export interface LimitOrderParams {
  symbol: string;
  side: LimitOrderSide;
  price: string;
  quantity: string;
  quoteAssetDecimals?: number;
  baseAssetDecimals?: number;
  chainId?: number;
}

export interface LimitOrderResult {
  orderId: string;
  txHash?: string;
  success: boolean;
}

export interface MarketOrderParams {
  symbol: string;
  side: LimitOrderSide;
  quantity: string;
  chainId?: number;
}

export interface MarketOrderResult {
  orderId: string;
  txHash?: string;
  success: boolean;
}

export interface TransactionRequest {
  kind: TransactionKind;
  params: DepositParams | WithdrawParams | BorrowParams | RepayParams | LimitOrderParams | MarketOrderParams;
}

export type TransactionResult =
  | DepositResult
  | WithdrawResult
  | BorrowResult
  | RepayResult
  | LimitOrderResult
  | MarketOrderResult;

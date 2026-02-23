/**
 * Transaction builder abstractions – chain-agnostic interface
 */

import type {
  DepositParams,
  DepositResult,
  WithdrawParams,
  WithdrawResult,
  BorrowParams,
  BorrowResult,
  RepayParams,
  RepayResult,
  LimitOrderParams,
  LimitOrderResult,
  MarketOrderParams,
  MarketOrderResult,
} from '@scalex/types';

export interface ITransactionBuilder {
  deposit(params: DepositParams): Promise<DepositResult>;
  withdraw(params: WithdrawParams): Promise<WithdrawResult>;
  borrow(params: BorrowParams): Promise<BorrowResult>;
  repay(params: RepayParams): Promise<RepayResult>;
  placeLimitOrder(params: LimitOrderParams): Promise<LimitOrderResult>;
  placeMarketOrder(params: MarketOrderParams): Promise<MarketOrderResult>;
}

export type ChainFamily = 'evm' | 'svm';

/**
 * SVM (Solana) transaction builder
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
import type { ITransactionBuilder } from '../../types';

export interface SvmBuilderDeps {
  programId: string;
  /** Sign and send transaction – provided by app (e.g. @solana/web3.js) */
  sendTransaction: (serializedTx: Uint8Array) => Promise<{ signature: string }>;
  /** Optional: get connection for reads */
  getConnection?: () => unknown;
}

export class SvmTransactionBuilder implements ITransactionBuilder {
  constructor(private deps: SvmBuilderDeps) {}

  async deposit(params: DepositParams): Promise<DepositResult> {
    const tx = await this.buildDepositInstruction(params);
    const { signature } = await this.deps.sendTransaction(tx);
    return { txHash: signature, success: true };
  }

  async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    const tx = await this.buildWithdrawInstruction(params);
    const { signature } = await this.deps.sendTransaction(tx);
    return { txHash: signature, success: true };
  }

  async borrow(params: BorrowParams): Promise<BorrowResult> {
    const tx = await this.buildBorrowInstruction(params);
    const { signature } = await this.deps.sendTransaction(tx);
    return { txHash: signature, success: true };
  }

  async repay(params: RepayParams): Promise<RepayResult> {
    const tx = await this.buildRepayInstruction(params);
    const { signature } = await this.deps.sendTransaction(tx);
    return { txHash: signature, success: true };
  }

  async placeLimitOrder(params: LimitOrderParams): Promise<LimitOrderResult> {
    const tx = await this.buildLimitOrderInstruction(params);
    const { signature } = await this.deps.sendTransaction(tx);
    return { orderId: signature, txHash: signature, success: true };
  }

  async placeMarketOrder(params: MarketOrderParams): Promise<MarketOrderResult> {
    const tx = await this.buildMarketOrderInstruction(params);
    const { signature } = await this.deps.sendTransaction(tx);
    return { orderId: signature, txHash: signature, success: true };
  }

  private async buildDepositInstruction(_params: DepositParams): Promise<Uint8Array> {
    return new Uint8Array(0);
  }

  private async buildWithdrawInstruction(_params: WithdrawParams): Promise<Uint8Array> {
    return new Uint8Array(0);
  }

  private async buildBorrowInstruction(_params: BorrowParams): Promise<Uint8Array> {
    return new Uint8Array(0);
  }

  private async buildRepayInstruction(_params: RepayParams): Promise<Uint8Array> {
    return new Uint8Array(0);
  }

  private async buildLimitOrderInstruction(_params: LimitOrderParams): Promise<Uint8Array> {
    return new Uint8Array(0);
  }

  private async buildMarketOrderInstruction(_params: MarketOrderParams): Promise<Uint8Array> {
    return new Uint8Array(0);
  }
}

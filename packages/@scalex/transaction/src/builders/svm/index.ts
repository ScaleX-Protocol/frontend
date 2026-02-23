/**
 * SVM (Solana) transaction builder
 *
 * Produces `SvmTransactionInstruction` objects.
 *
 * 🚧 STUB — All build methods throw until ScaleX Solana programs are deployed.
 * When contracts are ready, each method will construct the correct instruction
 * data and account metas for the program.
 */

import type {
  DepositParams,
  WithdrawParams,
  BorrowParams,
  RepayParams,
  LimitOrderParams,
  MarketOrderParams,
} from '@scalex/types';
import type {
  ITransactionBuilder,
  SvmTransactionInstruction,
  ChainFamily,
} from '../../types';

export interface SvmBuilderDeps {
  /** ScaleX program ID on Solana (base-58 public key) */
  programId: string;
}

export class SvmTransactionBuilder implements ITransactionBuilder {
  readonly chain: ChainFamily = 'svm';

  constructor(private deps: SvmBuilderDeps) {}

  // ─── Stubs ────────────────────────────────────────────────────────────────────
  // Each method returns a well-typed SvmTransactionInstruction with empty data.
  // Replace with real instruction encoding when Solana contracts are deployed.

  buildDeposit(_params: DepositParams): SvmTransactionInstruction {
    return this.stub('deposit');
  }

  buildWithdraw(_params: WithdrawParams): SvmTransactionInstruction {
    return this.stub('withdraw');
  }

  buildBorrow(_params: BorrowParams): SvmTransactionInstruction {
    return this.stub('borrow');
  }

  buildRepay(_params: RepayParams): SvmTransactionInstruction {
    return this.stub('repay');
  }

  buildLimitOrder(_params: LimitOrderParams): SvmTransactionInstruction {
    return this.stub('placeLimitOrder');
  }

  buildMarketOrder(_params: MarketOrderParams): SvmTransactionInstruction {
    return this.stub('placeMarketOrder');
  }

  // ─── Helper ───────────────────────────────────────────────────────────────────

  private stub(method: string): SvmTransactionInstruction {
    console.warn(
      `[SvmTransactionBuilder] "${method}" is a stub. ` +
        'Solana program instructions will be implemented when contracts are deployed.'
    );

    return {
      chain: 'svm',
      programId: this.deps.programId,
      data: new Uint8Array(0),
      accounts: [],
    };
  }
}

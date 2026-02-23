/**
 * @scalex/transaction – Universal transaction package
 *
 * Chain-agnostic instruction builder + DI registry.
 * Apps inject their platform-specific executor at startup.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────
export type {
  ITransactionBuilder,
  ChainFamily,
  TransactionInstruction,
  EvmTransactionInstruction,
  SvmTransactionInstruction,
  TxExecutor,
} from './types';

// ─── DI Registry ───────────────────────────────────────────────────────────────
export {
  setTransactionBuilder,
  getTransactionBuilder,
  setTxExecutor,
  getTxExecutor,
  createTransactionBuilder,
} from './transaction-builder';

// ─── Builders ──────────────────────────────────────────────────────────────────
export { EvmTransactionBuilder, type EvmBuilderDeps } from './builders/evm';
export { SvmTransactionBuilder, type SvmBuilderDeps } from './builders/svm';

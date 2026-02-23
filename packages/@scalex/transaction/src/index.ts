/**
 * @scalex/transaction – Universal transaction brain
 * Deposit, Borrow, Place Order via a single builder; EVM and SVM implemented in builders/.
 */

export type { ITransactionBuilder, ChainFamily } from './types';
export {
  setTransactionBuilder,
  getTransactionBuilder,
  createTransactionBuilder,
} from './transaction-builder';
export { EvmTransactionBuilder, type EvmBuilderDeps } from './builders/evm';
export { SvmTransactionBuilder, type SvmBuilderDeps } from './builders/svm';

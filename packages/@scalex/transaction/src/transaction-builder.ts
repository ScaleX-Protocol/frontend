/**
 * @scalex/transaction – Dependency Injection & execution utilities
 *
 * The `ITransactionBuilder` builds chain-agnostic instructions.
 * The `TxExecutor` callback (provided by the app layer) signs and sends them.
 *
 * Usage:
 *   // At app startup
 *   setTransactionBuilder(new EvmTransactionBuilder({ chainId, contracts }));
 *   setTxExecutor(myPrivyExecutor);
 *
 *   // In any hook
 *   const builder = getTransactionBuilder();
 *   const executor = getTxExecutor();
 *   const instruction = builder.buildDeposit(params);
 *   const txHash = await executor(instruction);
 */

import type { ITransactionBuilder, TxExecutor } from './types';

// ─── Builder registry ──────────────────────────────────────────────────────────

let _builder: ITransactionBuilder | null = null;

/**
 * Register the chain-specific transaction builder (EVM or SVM).
 * Call once at app startup after wallet/config is ready.
 */
export function setTransactionBuilder(builder: ITransactionBuilder): void {
  _builder = builder;
}

/**
 * Get the registered transaction builder.
 * Throws if `setTransactionBuilder()` has not been called.
 */
export function getTransactionBuilder(): ITransactionBuilder {
  if (!_builder) {
    throw new Error(
      '[transaction] setTransactionBuilder() has not been called. ' +
        'Register an EvmTransactionBuilder or SvmTransactionBuilder at app startup.'
    );
  }
  return _builder;
}

// ─── Executor registry ─────────────────────────────────────────────────────────

let _executor: TxExecutor | null = null;

/**
 * Register the platform-specific transaction executor.
 * - Web: wraps Privy `@privy-io/react-auth` embedded wallet
 * - Mobile: wraps Privy `@privy-io/expo` embedded wallet
 *
 * Call once at app startup (or whenever the executor changes).
 */
export function setTxExecutor(executor: TxExecutor): void {
  _executor = executor;
}

/**
 * Get the registered transaction executor.
 * Throws if `setTxExecutor()` has not been called.
 */
export function getTxExecutor(): TxExecutor {
  if (!_executor) {
    throw new Error(
      '[transaction] setTxExecutor() has not been called. ' +
        'Register a platform-specific executor (web or mobile) at app startup.'
    );
  }
  return _executor;
}

// ─── Convenience: build + execute in one step ──────────────────────────────────

/**
 * Convenience: build an instruction and immediately execute it.
 * Useful for simple fire-and-forget calls.
 */
export function createTransactionBuilder(builder: ITransactionBuilder): ITransactionBuilder {
  return builder;
}

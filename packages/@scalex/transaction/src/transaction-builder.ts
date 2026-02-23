/**
 * Universal transaction builder – Dependency Injection
 * apps/web and apps/mobile inject EVM or SVM builder and call txBuilder.deposit(amount) etc.
 */

import type { ITransactionBuilder } from './types';

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
 * Throws if setTransactionBuilder() has not been called.
 */
export function getTransactionBuilder(): ITransactionBuilder {
  if (!_builder) {
    throw new Error(
      '[transaction] setTransactionBuilder() has not been called. ' +
        'Register an EvmTransactionBuilder or SvmTransactionBuilder in your app root.'
    );
  }
  return _builder;
}

/**
 * Convenience: build and return the builder for one-off use.
 * Prefer setTransactionBuilder + getTransactionBuilder() for app-wide usage.
 */
export function createTransactionBuilder(builder: ITransactionBuilder): ITransactionBuilder {
  return builder;
}

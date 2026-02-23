/**
 * @scalex/transaction – Chain-agnostic transaction abstractions
 *
 * Key concepts:
 * - `EvmTransactionInstruction`: describes an EVM contract call (ABI + fn + args)
 * - `SvmTransactionInstruction`: describes a Solana instruction (program + data)
 * - `TransactionInstruction`: union of the above
 * - `TxExecutor`: callback injected by the app layer (web/mobile) to sign & send
 * - `ITransactionBuilder`: builds instructions without executing them
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

// ─── Chain family ──────────────────────────────────────────────────────────────

export type ChainFamily = 'evm' | 'svm';

// ─── EVM instruction ───────────────────────────────────────────────────────────

/**
 * Describes an EVM smart-contract call.
 * The app-level executor turns this into a `walletClient.writeContract()` call.
 */
export interface EvmTransactionInstruction {
  chain: 'evm';
  /** Target contract address */
  to: `0x${string}`;
  /** Contract ABI (or the relevant fragment) */
  abi: readonly unknown[];
  /** Solidity function name */
  functionName: string;
  /** Typed arguments for the function */
  args: readonly unknown[];
  /** Native value to send (default 0) */
  value?: bigint;
  /** Optional override for chain ID */
  chainId?: number;
}

// ─── SVM instruction ───────────────────────────────────────────────────────────

/**
 * Describes a Solana program instruction.
 * The app-level executor turns this into a `signAndSendTransaction()` call.
 *
 * When Solana contracts are ready, `data` will carry the serialised instruction
 * bytes and `accounts` will list the account metas.
 */
export interface SvmTransactionInstruction {
  chain: 'svm';
  /** Program public key (base-58) */
  programId: string;
  /** Serialised instruction data */
  data: Uint8Array;
  /** Account metas required by the instruction */
  accounts: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
}

// ─── Union ─────────────────────────────────────────────────────────────────────

export type TransactionInstruction =
  | EvmTransactionInstruction
  | SvmTransactionInstruction;

// ─── Executor callback ─────────────────────────────────────────────────────────

/**
 * A function provided by the app layer (web or mobile) that knows how to
 * sign and send a `TransactionInstruction` using the platform-specific
 * Privy SDK and returns the on-chain transaction hash / signature.
 */
export type TxExecutor = (
  instruction: TransactionInstruction
) => Promise<string>;

// ─── Transaction builder interface ─────────────────────────────────────────────

/**
 * Chain-specific builders implement this interface.
 * Each method returns a `TransactionInstruction` — it does NOT execute anything.
 * Execution is handled by the `TxExecutor` provided by the app layer.
 */
export interface ITransactionBuilder {
  readonly chain: ChainFamily;

  buildDeposit(params: DepositParams): TransactionInstruction;
  buildWithdraw(params: WithdrawParams): TransactionInstruction;
  buildBorrow(params: BorrowParams): TransactionInstruction;
  buildRepay(params: RepayParams): TransactionInstruction;
  buildLimitOrder(params: LimitOrderParams): TransactionInstruction;
  buildMarketOrder(params: MarketOrderParams): TransactionInstruction;
}

// ─── Re-export result types for convenience ────────────────────────────────────

export type {
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
};

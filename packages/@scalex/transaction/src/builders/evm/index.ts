/**
 * EVM (Base / Ethereum) transaction builder
 *
 * Produces `EvmTransactionInstruction` objects that the app-layer executor
 * turns into actual `walletClient.writeContract()` calls.
 */

import { BalanceManagerABI, ScaleXRouterABI } from '@scalex/service-wallet';
import type { ChainContractAddresses } from '@scalex/config';
import type {
  DepositParams,
  WithdrawParams,
  BorrowParams,
  RepayParams,
  LimitOrderParams,
  MarketOrderParams,
} from '@scalex/types';
import { parseUnits } from 'viem';
import type {
  ITransactionBuilder,
  EvmTransactionInstruction,
  ChainFamily,
} from '../../types';

export interface EvmBuilderDeps {
  chainId: number;
  contracts: ChainContractAddresses;
}

export class EvmTransactionBuilder implements ITransactionBuilder {
  readonly chain: ChainFamily = 'evm';

  constructor(private deps: EvmBuilderDeps) {}

  // ─── Deposit ──────────────────────────────────────────────────────────────────

  buildDeposit(params: DepositParams): EvmTransactionInstruction {
    const amountWei = parseUnits(params.amount, params.decimals);
    const tokenAddress = params.tokenAddress as `0x${string}`;

    return {
      chain: 'evm',
      to: this.deps.contracts.balanceManagerAddress,
      abi: BalanceManagerABI,
      functionName: 'depositLocal',
      args: [tokenAddress, amountWei, tokenAddress /* recipient placeholder */],
      value: 0n,
      chainId: params.chainId ?? this.deps.chainId,
    };
  }

  // ─── Withdraw ─────────────────────────────────────────────────────────────────

  buildWithdraw(params: WithdrawParams): EvmTransactionInstruction {
    const amountWei = parseUnits(params.amount, params.decimals);
    const tokenAddress = params.tokenAddress as `0x${string}`;

    return {
      chain: 'evm',
      to: this.deps.contracts.balanceManagerAddress,
      abi: BalanceManagerABI,
      functionName: 'withdraw',
      args: [tokenAddress, amountWei],
      value: 0n,
      chainId: params.chainId ?? this.deps.chainId,
    };
  }

  // ─── Borrow ───────────────────────────────────────────────────────────────────

  buildBorrow(params: BorrowParams): EvmTransactionInstruction {
    const amountWei = parseUnits(params.amount, params.decimals);
    const tokenAddress = params.tokenAddress as `0x${string}`;

    return {
      chain: 'evm',
      to: this.deps.contracts.scaleXRouterAddress,
      abi: ScaleXRouterABI,
      functionName: 'borrow',
      args: [tokenAddress, amountWei],
      value: 0n,
      chainId: params.chainId ?? this.deps.chainId,
    };
  }

  // ─── Repay ────────────────────────────────────────────────────────────────────

  buildRepay(params: RepayParams): EvmTransactionInstruction {
    const amountWei = parseUnits(params.amount, params.decimals);
    const tokenAddress = params.tokenAddress as `0x${string}`;

    return {
      chain: 'evm',
      to: this.deps.contracts.scaleXRouterAddress,
      abi: ScaleXRouterABI,
      functionName: 'repay',
      args: [tokenAddress, amountWei],
      value: 0n,
      chainId: params.chainId ?? this.deps.chainId,
    };
  }

  // ─── Limit Order ──────────────────────────────────────────────────────────────

  buildLimitOrder(params: LimitOrderParams): EvmTransactionInstruction {
    // NOTE: Full limit-order instruction building requires runtime data
    // (pool key, orderbook address) fetched from on-chain.
    // This provides the base instruction; the hook will enrich it.
    const priceWei = parseUnits(params.price, params.quoteAssetDecimals ?? 18);
    const quantityWei = parseUnits(params.quantity, params.baseAssetDecimals ?? 18);
    const side = params.side === 'buy' ? 0 : 1;

    return {
      chain: 'evm',
      to: this.deps.contracts.scaleXRouterAddress,
      abi: ScaleXRouterABI,
      functionName: 'placeLimitOrder',
      args: [
        /* pool – set by hook */ [],
        priceWei,
        quantityWei,
        side,
        /* timeInForce */ 0,
        /* depositAmount */ 0n,
        /* autoRepay */ false,
        /* autoBorrow */ false,
      ],
      value: 0n,
      chainId: params.chainId ?? this.deps.chainId,
    };
  }

  // ─── Market Order ─────────────────────────────────────────────────────────────

  buildMarketOrder(params: MarketOrderParams): EvmTransactionInstruction {
    const quantityWei = parseUnits(params.quantity, 18);
    const side = params.side === 'buy' ? 0 : 1;

    return {
      chain: 'evm',
      to: this.deps.contracts.scaleXRouterAddress,
      abi: ScaleXRouterABI,
      functionName: 'placeMarketOrder',
      args: [
        /* pool – set by hook */ [],
        quantityWei,
        side,
        /* depositAmount */ 0n,
        /* minOutAmount */ 0n,
        /* autoRepay */ false,
        /* autoBorrow */ false,
      ],
      value: 0n,
      chainId: params.chainId ?? this.deps.chainId,
    };
  }
}

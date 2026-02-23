/**
 * EVM (Base/Ethereum) transaction builder
 */

import type { ChainContractAddresses } from '@scalex/config';
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
import { parseUnits } from 'viem';
import type { ITransactionBuilder } from '../../types';

export interface EvmBuilderDeps {
  chainId: number;
  contracts: ChainContractAddresses;
  sendTransaction: (tx: { to: `0x${string}`; data: `0x${string}`; value?: bigint }) => Promise<{ hash: string }>;
  getPublicClient?: () => { readContract: (args: unknown) => Promise<unknown> };
}

export class EvmTransactionBuilder implements ITransactionBuilder {
  constructor(private deps: EvmBuilderDeps) {}

  async deposit(params: DepositParams): Promise<DepositResult> {
    const amountWei = parseUnits(params.amount, params.decimals);
    const data = this.encodeDeposit(params.tokenAddress as `0x${string}`, amountWei);
    const { hash } = await this.deps.sendTransaction({
      to: this.deps.contracts.balanceManagerAddress,
      data,
      value: 0n,
    });
    return { txHash: hash, success: true };
  }

  async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    const amountWei = parseUnits(params.amount, params.decimals);
    const data = this.encodeWithdraw(params.tokenAddress as `0x${string}`, amountWei);
    const { hash } = await this.deps.sendTransaction({
      to: this.deps.contracts.balanceManagerAddress,
      data,
      value: 0n,
    });
    return { txHash: hash, success: true };
  }

  async borrow(params: BorrowParams): Promise<BorrowResult> {
    const amountWei = parseUnits(params.amount, params.decimals);
    const data = this.encodeBorrow(params.tokenAddress as `0x${string}`, amountWei);
    const to = this.deps.contracts.lendingManagerAddress ?? this.deps.contracts.balanceManagerAddress;
    const { hash } = await this.deps.sendTransaction({ to, data, value: 0n });
    return { txHash: hash, success: true };
  }

  async repay(params: RepayParams): Promise<RepayResult> {
    const amountWei = parseUnits(params.amount, params.decimals);
    const data = this.encodeRepay(params.tokenAddress as `0x${string}`, amountWei);
    const to = this.deps.contracts.lendingManagerAddress ?? this.deps.contracts.balanceManagerAddress;
    const { hash } = await this.deps.sendTransaction({ to, data, value: 0n });
    return { txHash: hash, success: true };
  }

  async placeLimitOrder(params: LimitOrderParams): Promise<LimitOrderResult> {
    const data = this.encodeLimitOrder(params);
    const { hash } = await this.deps.sendTransaction({
      to: this.deps.contracts.scaleXRouterAddress,
      data,
      value: 0n,
    });
    return { orderId: hash, txHash: hash, success: true };
  }

  async placeMarketOrder(params: MarketOrderParams): Promise<MarketOrderResult> {
    const data = this.encodeMarketOrder(params);
    const { hash } = await this.deps.sendTransaction({
      to: this.deps.contracts.scaleXRouterAddress,
      data,
      value: 0n,
    });
    return { orderId: hash, txHash: hash, success: true };
  }

  private encodeDeposit(_token: `0x${string}`, _amountWei: bigint): `0x${string}` {
    return '0x' as `0x${string}`;
  }

  private encodeWithdraw(_token: `0x${string}`, _amountWei: bigint): `0x${string}` {
    return '0x' as `0x${string}`;
  }

  private encodeBorrow(_token: `0x${string}`, _amountWei: bigint): `0x${string}` {
    return '0x' as `0x${string}`;
  }

  private encodeRepay(_token: `0x${string}`, _amountWei: bigint): `0x${string}` {
    return '0x' as `0x${string}`;
  }

  private encodeLimitOrder(_params: LimitOrderParams): `0x${string}` {
    return '0x' as `0x${string}`;
  }

  private encodeMarketOrder(_params: MarketOrderParams): `0x${string}` {
    return '0x' as `0x${string}`;
  }
}

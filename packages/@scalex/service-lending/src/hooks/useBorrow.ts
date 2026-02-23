'use client';

/**
 * @scalex/service-lending – useBorrow
 *
 * Chain-agnostic borrow hook.
 * Business logic (validation, step management, error parsing) lives here.
 * Transaction execution is delegated to the `TxExecutor` provided by the app.
 */

import { useState, useCallback } from 'react';
import { getAddress, parseUnits } from 'viem';
import { ScaleXRouterABI } from '@scalex/service-wallet';
import { Contracts, ChainConfig } from '@scalex/config';
import type { TxExecutor, EvmTransactionInstruction } from '@scalex/transaction';
import { formatTokenAmount, parseContractError } from '../utils/lending.helper';

// Simple logger replacement (platform-agnostic)
const logger = {
  logError: (...args: any[]) => console.error(...args),
  log: (...args: any[]) => console.log(...args),
};

// Contract addresses from centralized config
const ROUTER_ADDRESSES = Contracts;

export enum BorrowStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SIMULATING = 'simulating',
  BORROWING = 'borrowing',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

interface UseBorrowOptions {
  /** Transaction executor injected by the app layer (web or mobile) */
  executor: TxExecutor;
  /** User's wallet address */
  address?: string;
  /** Whether user is authenticated and ready */
  isReady?: boolean;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

interface BorrowParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
}

export function useBorrow({
  executor,
  address,
  isReady = true,
  onSuccess,
  onError,
}: UseBorrowOptions) {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState<BorrowStep>(BorrowStep.IDLE);

  const getRouterAddress = useCallback((chainId?: number) => {
    const targetChainId = chainId || ChainConfig.defaultChainId;
    const chainContracts = ROUTER_ADDRESSES[targetChainId as keyof typeof ROUTER_ADDRESSES];

    if (!chainContracts) {
      const availableChains = Object.keys(ROUTER_ADDRESSES);
      const error = new Error(
        `ScaleXRouter contract not found on chain ${targetChainId}. Available chains: ${availableChains.join(', ')}`
      );
      console.error('ScaleXRouter contract not found', { targetChainId, availableChains });
      throw error;
    }

    return { address: chainContracts.scaleXRouterAddress, chainId: targetChainId };
  }, []);

  const borrow = async ({ tokenAddress, amount, decimals }: BorrowParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(BorrowStep.VALIDATING);

      // Validate authentication
      if (!isReady || !address) {
        throw new Error('Please connect your wallet first');
      }

      // Validate inputs
      if (!tokenAddress) {
        throw new Error('Token address is required');
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Invalid amount: must be greater than 0');
      }

      // Prepare addresses and amounts
      const { address: routerAddress, chainId } = getRouterAddress();
      const checksumTokenAddress = getAddress(tokenAddress);
      const amountInWei = parseUnits(amount, decimals);

      console.log(`[useBorrow] Borrowing ${amount} tokens`);

      // Build the transaction instruction
      setCurrentStep(BorrowStep.SIMULATING);

      const instruction: EvmTransactionInstruction = {
        chain: 'evm',
        to: routerAddress,
        abi: ScaleXRouterABI,
        functionName: 'borrow',
        args: [checksumTokenAddress, amountInWei],
        value: 0n,
        chainId,
      };

      // Execute via the app-layer executor
      // The executor handles: chain switching, simulation, signing, sending, confirmation
      setCurrentStep(BorrowStep.BORROWING);
      const txHash = await executor(instruction);

      console.log('[useBorrow] Borrow successful');
      setHash(txHash);
      setCurrentStep(BorrowStep.COMPLETED);
      setIsPending(false);
      setError(null);

      onSuccess?.(txHash);
      return txHash;
    } catch (err) {
      const parsedError = parseContractError(err);
      console.error('[useBorrow] Borrow failed');

      setIsPending(false);
      setCurrentStep(BorrowStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  return {
    borrow,
    isPending,
    isConfirming,
    isConfirmed: currentStep === BorrowStep.COMPLETED,
    error,
    hash,
    currentStep,
    isAuthenticated: isReady && !!address,
    address,
  };
}

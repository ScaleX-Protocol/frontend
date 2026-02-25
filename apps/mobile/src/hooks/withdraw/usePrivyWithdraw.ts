import { useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/expo';
import { useSolanaProvider } from '~/src/lib/solana/provider';
import { PublicKey } from '@solana/web3.js';
import { buildWithdrawCollateralIxs } from '~/src/lib/solana/lending';
import { sendTransactionViaPrivy } from '~/src/lib/solana/send-transaction';
import type { WithdrawTokenSymbol } from './useWithdrawableBalance';

export enum WithdrawStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SUBMITTING = 'submitting',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

interface UsePrivyWithdrawOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

interface WithdrawParams {
  tokenSymbol: WithdrawTokenSymbol;
  amount: string;
  decimals?: number;
}

export function usePrivyWithdraw({
  onSuccess,
  onError,
}: UsePrivyWithdrawOptions = {}) {
  const { isReady, user } = usePrivy();
  const { getProvider, getAddress } = useSolanaProvider();

  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState<WithdrawStep>(WithdrawStep.IDLE);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | undefined>();

  const address = getAddress();

  const withdraw = useCallback(
    async (params: WithdrawParams) => {
      try {
        setError(null);
        setIsPending(true);
        setCurrentStep(WithdrawStep.VALIDATING);

        const provider = await getProvider();
        if (!provider) {
          throw new Error('No Solana wallet. Please log in.');
        }
        if (!address) {
          throw new Error('Wallet address not available');
        }

        const amountNum = parseFloat(params.amount);
        if (Number.isNaN(amountNum) || amountNum <= 0) {
          throw new Error('Invalid withdraw amount');
        }

        setCurrentStep(WithdrawStep.SUBMITTING);
        const instructions = await buildWithdrawCollateralIxs({
          tokenSymbol: params.tokenSymbol,
          amount: params.amount,
          owner: new PublicKey(address),
          decimals: params.decimals,
        });

        const signature = await sendTransactionViaPrivy({
          instructions,
          feePayer: new PublicKey(address),
          provider,
        });

        setCurrentStep(WithdrawStep.COMPLETED);
        setHash(signature);
        setIsPending(false);
        onSuccess?.(signature);
        return signature;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setCurrentStep(WithdrawStep.ERROR);
        setIsPending(false);
        onError?.(e);
        throw e;
      }
    },
    [getProvider, address, onSuccess, onError]
  );

  return {
    withdraw,
    isPending,
    isConfirming: currentStep === WithdrawStep.CONFIRMING,
    isConfirmed: currentStep === WithdrawStep.COMPLETED,
    error,
    hash,
    currentStep,
    isAuthenticated: Boolean(isReady && user && address),
    address: address ?? undefined,
  };
}

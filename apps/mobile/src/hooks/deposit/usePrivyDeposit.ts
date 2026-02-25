import { useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/expo';
import { useSolanaProvider } from '~/src/lib/solana/provider';
import { PublicKey } from '@solana/web3.js';
import { buildDepositCollateralIxs } from '~/src/lib/solana/lending';
import { sendTransactionViaPrivy } from '~/src/lib/solana/send-transaction';

export enum DepositStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SUBMITTING = 'submitting',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

interface UsePrivyDepositOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

interface DepositParams {
  tokenSymbol: string;
  amount: string;
  decimals?: number;
}

export function usePrivyDeposit({
  onSuccess,
  onError,
}: UsePrivyDepositOptions = {}) {
  const { isReady, user } = usePrivy();
  const { getProvider, getAddress } = useSolanaProvider();

  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState<DepositStep>(DepositStep.IDLE);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | undefined>();

  const address = getAddress();

  const deposit = useCallback(
    async (params: DepositParams) => {
      try {
        setError(null);
        setIsPending(true);
        setCurrentStep(DepositStep.VALIDATING);

        const provider = await getProvider();
        if (!provider) {
          throw new Error('No Solana wallet. Please log in.');
        }
        if (!address) {
          throw new Error('Wallet address not available');
        }

        const amountNum = parseFloat(params.amount);
        if (Number.isNaN(amountNum) || amountNum <= 0) {
          throw new Error('Invalid deposit amount');
        }

        setCurrentStep(DepositStep.SUBMITTING);
        const instructions = await buildDepositCollateralIxs({
          tokenSymbol: params.tokenSymbol as 'USDT' | 'BTC' | 'WETH',
          amount: params.amount,
          owner: new PublicKey(address),
          decimals: params.decimals,
        });

        const signature = await sendTransactionViaPrivy({
          instructions,
          feePayer: new PublicKey(address),
          provider,
        });

        setCurrentStep(DepositStep.COMPLETED);
        setHash(signature);
        setIsPending(false);
        onSuccess?.(signature);
        return signature;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setCurrentStep(DepositStep.ERROR);
        setIsPending(false);
        onError?.(e);
        throw e;
      }
    },
    [getProvider, address, onSuccess, onError]
  );

  return {
    deposit,
    isPending,
    isConfirming: currentStep === DepositStep.CONFIRMING,
    isConfirmed: currentStep === DepositStep.COMPLETED,
    error,
    hash,
    currentStep,
    isAuthenticated: Boolean(isReady && user && address),
    address: address ?? undefined,
  };
}

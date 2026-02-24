'use client';

/**
 * Solana Deposit Hook (Stub)
 *
 * TODO: Implement using Anchor + IDL for the Solana BalanceManager program.
 * This stub mirrors the EVM useDeposit interface so components can switch
 * between chains without changing their code.
 */

import { useState, useCallback } from 'react';

export enum SolanaDepositStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    DEPOSITING = 'depositing',
    CONFIRMING = 'confirming',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaDepositOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

interface SolanaDepositParams {
    tokenMint: string;   // SPL token mint address
    amount: string;
    decimals: number;
}

export function useSolanaDeposit({ onSuccess, onError }: UseSolanaDepositOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaDepositStep>(SolanaDepositStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const deposit = useCallback(async (_params: SolanaDepositParams) => {
        setIsPending(true);
        setCurrentStep(SolanaDepositStep.VALIDATING);
        setError(null);

        try {
            // TODO: Implement Anchor transaction
            // 1. Build instruction via program.methods.deposit(...)
            // 2. Send transaction via wallet.sendTransaction()
            // 3. Confirm transaction
            throw new Error('Solana deposit not yet implemented — requires Anchor IDL');
        } catch (err) {
            const depositError = err instanceof Error ? err : new Error('Solana deposit failed');
            setError(depositError);
            setCurrentStep(SolanaDepositStep.ERROR);
            setIsPending(false);
            onError?.(depositError);
        }
    }, [onError]);

    return {
        deposit,
        isPending,
        currentStep,
        error,
        txHash,
    };
}

'use client';

/**
 * Solana Withdraw Hook (Stub)
 *
 * TODO: Implement using Anchor + IDL for the Solana BalanceManager program.
 * This stub mirrors the EVM useWithdraw interface so components can switch
 * between chains without changing their code.
 */

import { useState, useCallback } from 'react';

export enum SolanaWithdrawStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    WITHDRAWING = 'withdrawing',
    CONFIRMING = 'confirming',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaWithdrawOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

interface SolanaWithdrawParams {
    tokenMint: string;   // SPL token mint address
    amount: string;
    decimals: number;
}

export function useSolanaWithdraw({ onSuccess, onError }: UseSolanaWithdrawOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaWithdrawStep>(SolanaWithdrawStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const withdraw = useCallback(async (_params: SolanaWithdrawParams) => {
        setIsPending(true);
        setCurrentStep(SolanaWithdrawStep.VALIDATING);
        setError(null);

        try {
            // TODO: Implement Anchor transaction
            // 1. Build instruction via program.methods.withdraw(...)
            // 2. Send transaction via wallet.sendTransaction()
            // 3. Confirm transaction
            throw new Error('Solana withdraw not yet implemented — requires Anchor IDL');
        } catch (err) {
            const withdrawError = err instanceof Error ? err : new Error('Solana withdraw failed');
            setError(withdrawError);
            setCurrentStep(SolanaWithdrawStep.ERROR);
            setIsPending(false);
            onError?.(withdrawError);
        }
    }, [onError]);

    return {
        withdraw,
        isPending,
        currentStep,
        error,
        txHash,
    };
}

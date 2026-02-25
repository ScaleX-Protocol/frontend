'use client';

/**
 * Solana Repay Hook (Stub)
 *
 * TODO: Implement using Anchor + IDL for the Solana Lending program.
 * This stub mirrors the EVM useRepay interface so components can
 * switch between chains without changing their code.
 *
 * NOTE: On Solana, the ERC20-style approve→repay flow doesn't apply.
 * SPL token transfers can be done directly via CPI within the program,
 * or via delegate authority if needed.
 */

import { useState, useCallback } from 'react';

export enum SolanaRepayStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    REPAYING = 'repaying',
    CONFIRMING = 'confirming',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaRepayOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

interface SolanaRepayParams {
    tokenMint: string;   // SPL token mint address
    amount: string;
    decimals: number;
}

export function useSolanaRepay({ onSuccess, onError }: UseSolanaRepayOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaRepayStep>(SolanaRepayStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const repay = useCallback(async (_params: SolanaRepayParams) => {
        setIsPending(true);
        setCurrentStep(SolanaRepayStep.VALIDATING);
        setError(null);

        try {
            // TODO: Implement Anchor transaction
            // 1. Build instruction via program.methods.repay(...)
            // 2. No separate approval needed (Solana CPI handles token transfers)
            // 3. Send transaction via wallet.sendTransaction()
            // 4. Confirm transaction
            throw new Error('Solana repay not yet implemented — requires Anchor IDL');
        } catch (err) {
            const repayError = err instanceof Error ? err : new Error('Solana repay failed');
            setError(repayError);
            setCurrentStep(SolanaRepayStep.ERROR);
            setIsPending(false);
            onError?.(repayError);
        }
    }, [onError]);

    return {
        repay,
        isPending,
        currentStep,
        error,
        txHash,
    };
}

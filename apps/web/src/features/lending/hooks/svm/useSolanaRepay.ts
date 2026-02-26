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
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useSolanaSafe } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    TOKEN_PROGRAM_ID,
    getTokenMint,
    getLendingPoolAddress,
} from '@/lib/anchor';
import { derivePoolVault, deriveUserCollateral } from '@/lib/anchor/pda';

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
    /** Token symbol, e.g. 'USDC' */
    tokenSymbol: string;
    /** Human-readable amount, e.g. '100.5' */
    amount: string;
    /** Token decimals (default 6) */
    decimals?: number;
    /** Privy wallet object */
    wallet: {
        address: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signTransaction: (tx: any) => Promise<any>;
    };
}

export function useSolanaRepay({ onSuccess, onError }: UseSolanaRepayOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaRepayStep>(SolanaRepayStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const solana = useSolanaSafe();
    const connection = solana?.connection ?? null;

    const repay = useCallback(async (params: SolanaRepayParams) => {
        setIsPending(true);
        setCurrentStep(SolanaRepayStep.VALIDATING);
        setError(null);
        setTxHash(null);

        try {
            // ── 1. Validate ──────────────────────────────────
            if (!connection) throw new Error('Solana connection not available');
            if (!params.wallet?.address) throw new Error('Wallet not connected');

            const amountNum = parseFloat(params.amount);
            if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid repay amount');

            const assetMint = getTokenMint(params.tokenSymbol);
            if (!assetMint) throw new Error(`Unknown token: ${params.tokenSymbol}`);

            const lendingPool = getLendingPoolAddress(params.tokenSymbol);
            if (!lendingPool) throw new Error(`No lending pool for: ${params.tokenSymbol}`);

            // ── 2. Resolve accounts ──────────────────────────
            const decimals = params.decimals ?? 6;
            const repayAmountRaw = new BN(Math.floor(amountNum * 10 ** decimals));

            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const repayerPubkey = anchorWallet.publicKey;

            // Using the same pubkey for borrower and repayer here (user repays their own debt)
            const borrowerPubkey = repayerPubkey;

            const userTokenAccount = getAssociatedTokenAddressSync(assetMint, repayerPubkey);
            const [poolVault] = derivePoolVault(lendingPool);
            const [userCollateral] = deriveUserCollateral(lendingPool, borrowerPubkey);

            // ── 3. Send repay instruction ───────────────────
            setCurrentStep(SolanaRepayStep.REPAYING);

            const signature = await program.methods
                .repay(repayAmountRaw)
                .accounts({
                    repayer: repayerPubkey,
                    userTokenAccount,
                    assetMint,
                    lendingPool,
                    poolVault,
                    userCollateral,
                    borrower: borrowerPubkey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            // ── 4. Confirm ──────────────────────────────────
            setCurrentStep(SolanaRepayStep.CONFIRMING);

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            }, 'confirmed');

            setTxHash(signature);
            setCurrentStep(SolanaRepayStep.COMPLETED);
            setIsPending(false);
            onSuccess?.(signature);
        } catch (err) {
            const repayError = err instanceof Error ? err : new Error('Solana repay failed');
            setError(repayError);
            setCurrentStep(SolanaRepayStep.ERROR);
            setIsPending(false);
            onError?.(repayError);
        }
    }, [connection, onSuccess, onError]);

    return {
        repay,
        isPending,
        isConfirming: currentStep === SolanaRepayStep.CONFIRMING,
        isConfirmed: currentStep === SolanaRepayStep.COMPLETED,
        currentStep,
        error,
        txHash,
    };
}

'use client';

/**
 * Solana Deposit Hook — depositCollateral via Anchor IDL
 *
 * Uses the on-chain `depositCollateral(amount)` instruction from the
 * OpenBook V2 + Lending extension program.
 *
 * Accounts required by IDL:
 *   owner            — signer / payer
 *   userTokenAccount  — user's ATA for the asset
 *   assetMint         — SPL token mint
 *   lendingPool       — lending pool address (from constants)
 *   poolVault         — PDA: ["PoolVault", lendingPool]
 *   userCollateral    — PDA: ["UserCollateral", lendingPool, owner]
 *   tokenProgram      — SPL Token program
 *   systemProgram     — System program
 *
 * Flow:
 *   1. Validate params (amount, wallet, token symbol)
 *   2. Resolve lending pool, pool vault PDA, user collateral PDA
 *   3. Get/create user's ATA for the asset mint
 *   4. Send depositCollateral(amount) instruction
 *   5. Confirm transaction
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

export enum SolanaDepositStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    SUBMITTING = 'submitting',
    CONFIRMING = 'confirming',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaDepositOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

export interface SolanaDepositParams {
    /** Token symbol, e.g. 'BTC', 'USDT', 'WETH' */
    tokenSymbol: string;
    /** Human-readable amount, e.g. '1.5' */
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

export function useSolanaDeposit({ onSuccess, onError }: UseSolanaDepositOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [currentStep, setCurrentStep] = useState<SolanaDepositStep>(SolanaDepositStep.IDLE);
    const [error, setError] = useState<Error | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const solana = useSolanaSafe();
    const connection = solana?.connection ?? null;

    const deposit = useCallback(async (params: SolanaDepositParams) => {
        setIsPending(true);
        setCurrentStep(SolanaDepositStep.VALIDATING);
        setError(null);
        setTxHash(null);

        try {
            // ── 1. Validate ──────────────────────────────────
            if (!connection) throw new Error('Solana connection not available');
            if (!params.wallet?.address) throw new Error('Wallet not connected');

            const amountNum = parseFloat(params.amount);
            if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid deposit amount');

            const assetMint = getTokenMint(params.tokenSymbol);
            if (!assetMint) throw new Error(`Unknown token: ${params.tokenSymbol}`);

            const lendingPool = getLendingPoolAddress(params.tokenSymbol);
            if (!lendingPool) throw new Error(`No lending pool for: ${params.tokenSymbol}`);

            // ── 2. Resolve accounts ──────────────────────────
            const decimals = params.decimals ?? 6;
            const amountRaw = new BN(Math.floor(amountNum * 10 ** decimals));

            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const ownerPubkey = anchorWallet.publicKey;

            const userTokenAccount = getAssociatedTokenAddressSync(assetMint, ownerPubkey);
            const [poolVault] = derivePoolVault(lendingPool);
            const [userCollateral] = deriveUserCollateral(lendingPool, ownerPubkey);

            // ── 3. Send depositCollateral ────────────────────
            setCurrentStep(SolanaDepositStep.SUBMITTING);

            const signature = await program.methods
                .depositCollateral(amountRaw)
                .accounts({
                    owner: ownerPubkey,
                    userTokenAccount,
                    assetMint,
                    lendingPool,
                    poolVault,
                    userCollateral,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            // ── 4. Confirm ──────────────────────────────────
            setCurrentStep(SolanaDepositStep.CONFIRMING);

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            }, 'confirmed');

            setTxHash(signature);
            setCurrentStep(SolanaDepositStep.COMPLETED);
            setIsPending(false);
            onSuccess?.(signature);
        } catch (err) {
            const depositError = err instanceof Error ? err : new Error('Deposit failed');
            setError(depositError);
            setCurrentStep(SolanaDepositStep.ERROR);
            setIsPending(false);
            onError?.(depositError);
        }
    }, [connection, onSuccess, onError]);

    return {
        deposit,
        isPending,
        isConfirming: currentStep === SolanaDepositStep.CONFIRMING,
        isConfirmed: currentStep === SolanaDepositStep.COMPLETED,
        error,
        txHash,
        currentStep,
    };
}

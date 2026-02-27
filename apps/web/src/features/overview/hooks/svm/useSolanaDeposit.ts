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
 *   3. Build tx: createATA (if not exists) + depositCollateral
 *   4. Sign via Privy modal, send raw transaction
 *   5. Confirm transaction
 */

import { useState, useCallback } from 'react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
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
    /** Token mint address (Solana pubkey string). If provided, takes precedence over getTokenMint(tokenSymbol). */
    tokenMint?: string;
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

/**
 * Poll getSignatureStatuses until the transaction is confirmed or the blockhash expires.
 * Avoids WebSocket subscription hangs that occur with connection.confirmTransaction().
 */
async function pollForConfirmation(
    connection: import('@solana/web3.js').Connection,
    signature: string,
    lastValidBlockHeight: number,
    intervalMs = 2000,
    timeoutMs = 90_000,
): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const currentSlot = await connection.getBlockHeight('confirmed').catch(() => 0);
        if (currentSlot > lastValidBlockHeight) {
            throw new Error('Transaction expired (blockhash no longer valid). Please try again.');
        }

        const { value } = await connection.getSignatureStatuses([signature]);
        const status = value[0];

        if (status) {
            if (status.err) {
                throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
            }
            if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
                return; // success
            }
        }

        await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error('Transaction confirmation timed out. Check your wallet for the transaction status.');
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

            const assetMint = params.tokenMint
                ? new PublicKey(params.tokenMint)
                : getTokenMint(params.tokenSymbol);
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
            const [poolVault] = derivePoolVault(assetMint);
            const [userCollateral] = deriveUserCollateral(ownerPubkey);

            // ── 3. Validate balance ──────────────────────────
            // Check ATA existence and balance before building the transaction.
            const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
            if (userTokenAccountInfo) {
                const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
                const balance = tokenBalance.value.uiAmount ?? 0;
                if (amountNum > balance) {
                    throw new Error(`Insufficient ${params.tokenSymbol} balance. Available: ${balance}`);
                }
            } else if (amountNum > 0) {
                // ATA doesn't exist → zero balance
                throw new Error(`Insufficient ${params.tokenSymbol} balance. Available: 0`);
            }

            // ── 4. Build transaction ─────────────────────────
            const depositIx = await program.methods
                .depositCollateral(amountRaw)
                .accountsStrict({
                    owner: ownerPubkey,
                    userTokenAccount,
                    assetMint,
                    lendingPool,
                    poolVault,
                    userCollateral,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .instruction();

            const tx = new Transaction();
            tx.add(depositIx);

            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            tx.recentBlockhash = blockhash;
            tx.feePayer = ownerPubkey;

            // ── 4. Sign via Privy ────────────────────────────
            setCurrentStep(SolanaDepositStep.SUBMITTING);
            const signedTx = await anchorWallet.signTransaction(tx);

            // ── 5. Send ──────────────────────────────────────
            const signature = await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });

            // ── 6. Confirm via polling (avoids WebSocket subscription hangs) ──
            setCurrentStep(SolanaDepositStep.CONFIRMING);
            await pollForConfirmation(connection, signature, lastValidBlockHeight);

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

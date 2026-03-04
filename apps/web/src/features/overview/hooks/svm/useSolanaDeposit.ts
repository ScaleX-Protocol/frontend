'use client';

/**
 * Solana Deposit Hook — deposit via Anchor IDL
 *
 * Supports two flows:
 *
 * A) Single-wallet: embedded wallet signs deposit directly to lending pool.
 *    wallet.address == owner; UserBalance credited to embedded wallet.
 *
 * B) External→Embedded (dual-wallet): external wallet (Phantom) funds embedded
 *    wallet first, then embedded wallet deposits to lending pool.
 *    Phase 1: external wallet signs SPL transfer (external ATA → embedded ATA).
 *    Phase 2: embedded wallet signs deposit (embedded ATA → lending pool).
 *    This mirrors the EVM BalanceManager pattern where external signs but
 *    embedded wallet is credited.
 *
 * Accounts required by IDL (deposit instruction):
 *   owner            — signer / payer
 *   userTokenAccount  — user's ATA for the asset
 *   assetMint         — SPL token mint
 *   lendingPool       — lending pool address (from constants)
 *   poolVault         — PDA: ["PoolVault", asset_mint]
 *   userBalance       — PDA: ["UserBalance", owner]
 *   tokenProgram      — SPL Token program
 *   systemProgram     — System program
 */

import { useState, useCallback } from 'react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountIdempotentInstruction,
    createTransferCheckedInstruction,
} from '@solana/spl-token';
import { useSolanaSafe } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    TOKEN_PROGRAM_ID,
    getTokenMint,
    getLendingPoolAddress,
} from '@/lib/anchor';
import { derivePoolVault, deriveUserBalance } from '@/lib/anchor/pda';

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

type WalletParam = {
    address: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signTransaction: (tx: any) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendTransaction?: (tx: any, connection: any) => Promise<string>;
};

export interface SolanaDepositParams {
    /** Token symbol, e.g. 'BTC', 'USDT', 'WETH' */
    tokenSymbol: string;
    /** Human-readable amount, e.g. '1.5' */
    amount: string;
    /** Token decimals (default 6) */
    decimals?: number;
    /**
     * Primary signing wallet.
     * - Single-wallet flow: this is the embedded wallet (Privy).
     * - Dual-wallet flow: this is the external wallet (Phantom); it signs the
     *   SPL transfer from its ATA to the embedded wallet's ATA.
     */
    wallet: WalletParam;
    /**
     * Embedded wallet for dual-wallet flow.
     * When provided (and address differs from wallet.address), the hook executes
     * a two-phase deposit: external transfers tokens to embedded, then embedded
     * deposits to the lending pool.
     */
    embeddedWallet?: WalletParam;
}

/**
 * Poll getSignatureStatuses until the transaction is confirmed or the blockhash expires.
 * Avoids WebSocket subscription hangs that occur with connection.confirmTransaction().
 */
async function pollForConfirmation(
    connection: import('@solana/web3.js').Connection,
    signature: string,
    lastValidBlockHeight: number,
    intervalMs = 5000,
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

            const assetMint = getTokenMint(params.tokenSymbol);
            if (!assetMint) throw new Error(`Unknown token: ${params.tokenSymbol}`);

            const lendingPool = getLendingPoolAddress(params.tokenSymbol);
            if (!lendingPool) throw new Error(`No lending pool for: ${params.tokenSymbol}`);

            const decimals = params.decimals ?? 6;
            const amountRaw = new BN(Math.floor(amountNum * 10 ** decimals));

            // ── 2. Determine flow ────────────────────────────
            const isDualWallet =
                params.embeddedWallet &&
                params.embeddedWallet.address !== params.wallet.address &&
                params.embeddedWallet.address !== 'Not Created';

            if (isDualWallet && params.embeddedWallet) {
                // ── Dual-wallet flow ─────────────────────────
                // Phase 1: external wallet transfers tokens to embedded wallet's ATA.
                // Phase 2: embedded wallet deposits from its ATA to lending pool.

                if (!params.wallet.address || params.wallet.address === 'Not Connected') {
                    throw new Error('External wallet address not available');
                }
                if (!params.embeddedWallet.address || params.embeddedWallet.address === 'Not Created') {
                    throw new Error('Embedded wallet not created yet');
                }

                const externalPubkey = new PublicKey(params.wallet.address);
                const embeddedPubkey = new PublicKey(params.embeddedWallet.address);

                const externalAta = getAssociatedTokenAddressSync(assetMint, externalPubkey);
                const embeddedAta = getAssociatedTokenAddressSync(assetMint, embeddedPubkey);

                // ── Phase 1: Validate external balance ───────
                const externalAtaInfo = await connection.getAccountInfo(externalAta);
                if (!externalAtaInfo) {
                    throw new Error(`Insufficient ${params.tokenSymbol} balance. Available: 0`);
                }
                const externalBalance = await connection.getTokenAccountBalance(externalAta);
                const available = externalBalance.value.uiAmount ?? 0;
                if (amountNum > available) {
                    throw new Error(`Insufficient ${params.tokenSymbol} balance. Available: ${available}`);
                }

                // ── Phase 1: Build SPL transfer tx ───────────
                const transferTx = new Transaction();

                // Create embedded wallet's ATA if it doesn't exist
                transferTx.add(
                    createAssociatedTokenAccountIdempotentInstruction(
                        externalPubkey, // payer
                        embeddedAta,
                        embeddedPubkey,
                        assetMint,
                    )
                );

                // SPL transfer: external ATA → embedded ATA
                transferTx.add(
                    createTransferCheckedInstruction(
                        externalAta,
                        assetMint,
                        embeddedAta,
                        externalPubkey,
                        BigInt(amountRaw.toString()),
                        decimals,
                    )
                );

                const { blockhash: bh1, lastValidBlockHeight: lvbh1 } =
                    await connection.getLatestBlockhash('confirmed');
                transferTx.recentBlockhash = bh1;
                transferTx.feePayer = externalPubkey;

                setCurrentStep(SolanaDepositStep.SUBMITTING);

                // Phase 1: External wallet signs + sends SPL transfer via sendTransaction.
                // sendTransaction is the correct Privy API for external wallets (Phantom etc.).
                // signTransaction alone causes "e is not iterable" inside Privy's Wallet Standard wrapper.
                if (!params.wallet.sendTransaction) {
                    throw new Error('External wallet does not support sendTransaction');
                }
                const transferSig = await params.wallet.sendTransaction(transferTx, connection);

                setCurrentStep(SolanaDepositStep.CONFIRMING);
                await pollForConfirmation(connection, transferSig, lvbh1);

                // ── Phase 2: Embedded wallet deposits to pool ─
                // Build tx manually so we can use pollForConfirmation instead of
                // Anchor's internal confirmTransaction (which times out at 30s).
                const embeddedAnchorWallet = createAnchorWallet(params.embeddedWallet);
                const { program } = createOpenbookProgram(connection, embeddedAnchorWallet);

                const [poolVault] = derivePoolVault(assetMint);
                const [userBalance] = deriveUserBalance(embeddedPubkey);

                // Build the unsigned transaction via Anchor
                const depositTx = await program.methods
                    .deposit(amountRaw)
                    .accountsStrict({
                        owner: embeddedPubkey,
                        userTokenAccount: embeddedAta,
                        assetMint,
                        lendingPool,
                        poolVault,
                        userBalance,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                    })
                    .transaction();

                const { blockhash: bh2, lastValidBlockHeight: lvbh2 } =
                    await connection.getLatestBlockhash('confirmed');
                depositTx.recentBlockhash = bh2;
                depositTx.feePayer = embeddedPubkey;

                // Sign with embedded wallet (Privy dialog)
                const signedDepositTx = await embeddedAnchorWallet.signTransaction(depositTx);

                setCurrentStep(SolanaDepositStep.SUBMITTING);
                const depositSig = await connection.sendRawTransaction(signedDepositTx.serialize(), {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                });

                setCurrentStep(SolanaDepositStep.CONFIRMING);
                await pollForConfirmation(connection, depositSig, lvbh2);

                setTxHash(depositSig);
                setCurrentStep(SolanaDepositStep.COMPLETED);
                setIsPending(false);
                onSuccess?.(depositSig);
                return;

            } else {
                // ── Single-wallet flow ───────────────────────
                // The signing wallet IS the owner — deposit directly to lending pool.

                const anchorWallet = createAnchorWallet(params.wallet);
                const { program } = createOpenbookProgram(connection, anchorWallet);
                const ownerPubkey = anchorWallet.publicKey;

                const userTokenAccount = getAssociatedTokenAddressSync(assetMint, ownerPubkey);
                const [poolVault] = derivePoolVault(assetMint);
                const [userBalance] = deriveUserBalance(ownerPubkey);

                // Validate balance
                const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
                if (userTokenAccountInfo) {
                    const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
                    const balance = tokenBalance.value.uiAmount ?? 0;
                    if (amountNum > balance) {
                        throw new Error(`Insufficient ${params.tokenSymbol} balance. Available: ${balance}`);
                    }
                } else if (amountNum > 0) {
                    throw new Error(`Insufficient ${params.tokenSymbol} balance. Available: 0`);
                }

                // Build tx manually to use pollForConfirmation instead of Anchor's 30s timeout.
                const depositTxSingle = await program.methods
                    .deposit(amountRaw)
                    .accountsStrict({
                        owner: ownerPubkey,
                        userTokenAccount,
                        assetMint,
                        lendingPool,
                        poolVault,
                        userBalance,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                    })
                    .transaction();

                const { blockhash: bhSingle, lastValidBlockHeight } =
                    await connection.getLatestBlockhash('confirmed');
                depositTxSingle.recentBlockhash = bhSingle;
                depositTxSingle.feePayer = ownerPubkey;

                const signedSingle = await anchorWallet.signTransaction(depositTxSingle);

                setCurrentStep(SolanaDepositStep.SUBMITTING);
                const signature = await connection.sendRawTransaction(signedSingle.serialize(), {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                });

                setCurrentStep(SolanaDepositStep.CONFIRMING);
                await pollForConfirmation(connection, signature, lastValidBlockHeight);

                setTxHash(signature);
                setCurrentStep(SolanaDepositStep.COMPLETED);
                setIsPending(false);
                onSuccess?.(signature);
            }
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

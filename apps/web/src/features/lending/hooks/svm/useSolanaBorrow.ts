'use client';

/**
 * Solana Borrow Hook — borrow via Anchor IDL
 *
 * Avoids importing @solana/spl-token to prevent "Buffer is not defined"
 * crash during Vite HMR. ATA derivation and creation are done manually
 * using hardcoded program IDs + TransactionInstruction from web3.js.
 *
 * userBalance PDA seeds: ["UserBalance", owner] — created by the deposit instruction.
 */

import { useState, useCallback } from 'react';
import { PublicKey, Transaction, TransactionInstruction, SystemProgram, Connection } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useSolanaSafe } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    getTokenMint,
    getLendingPoolAddress,
    getOracleAddress,
    TOKEN_PROGRAM_ID,
} from '@/lib/anchor';
import { derivePoolVault, deriveUserBalance, deriveStubOracle } from '@/lib/anchor/pda';

// Hardcoded well-known program IDs — never vary across Solana clusters
const ATA_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const SPL_TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

/** Derives the ATA address using hardcoded program IDs (no @solana/spl-token) */
function getATA(mint: PublicKey, owner: PublicKey): PublicKey {
    const [ata] = PublicKey.findProgramAddressSync(
        [owner.toBuffer(), SPL_TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        ATA_PROGRAM_ID,
    );
    return ata;
}

/** Builds a createAssociatedTokenAccount instruction using hardcoded program IDs */
function createAtaInstruction(
    payer: PublicKey,
    ata: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
): TransactionInstruction {
    console.log('[borrow-debug] createAtaInstruction programId:', ATA_PROGRAM_ID.toBase58());
    return new TransactionInstruction({
        programId: ATA_PROGRAM_ID,
        keys: [
            { pubkey: payer, isSigner: true, isWritable: true },
            { pubkey: ata, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: false },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: SPL_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
    });
}

export enum SolanaBorrowStep {
    IDLE = 'idle',
    VALIDATING = 'validating',
    BORROWING = 'borrowing',
    CONFIRMING = 'confirming',
    SYNCING = 'syncing',
    COMPLETED = 'completed',
    ERROR = 'error',
}

interface UseSolanaBorrowOptions {
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
}

interface SolanaBorrowParams {
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

/**
 * Send a transaction and poll getSignatureStatus until confirmed.
 * Avoids Anchor's .rpc() 30s devnet timeout.
 */
async function sendAndConfirm(
    connection: Connection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    anchorWallet: any,
    tx: Transaction,
    ownerPubkey: PublicKey,
    timeoutMs = 120_000,
): Promise<string> {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = ownerPubkey;

    const signed = await anchorWallet.signTransaction(tx);
    const rawTx = signed.serialize();

    const sig = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 0,
    });

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const { value: status } = await connection.getSignatureStatus(sig, {
            searchTransactionHistory: true,
        });

        if (status) {
            if (status.err) {
                throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
            }
            if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
                return sig;
            }
        }

        const currentHeight = await connection.getBlockHeight('confirmed');
        if (currentHeight <= lastValidBlockHeight) {
            await connection.sendRawTransaction(rawTx, { skipPreflight: true, maxRetries: 0 });
        }

        await new Promise(r => setTimeout(r, 2_000));
    }

    const { value: finalStatus } = await connection.getSignatureStatus(sig, {
        searchTransactionHistory: true,
    });
    if (finalStatus && !finalStatus.err &&
        (finalStatus.confirmationStatus === 'confirmed' || finalStatus.confirmationStatus === 'finalized')) {
        return sig;
    }

    throw new Error(`Transaction not confirmed within ${timeoutMs / 1000}s (sig: ${sig})`);
}

export function useSolanaBorrow({ onSuccess, onError }: UseSolanaBorrowOptions = {}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentStep, setCurrentStep] = useState<SolanaBorrowStep>(SolanaBorrowStep.IDLE);
    const [txHash, setTxHash] = useState<string | null>(null);

    const solana = useSolanaSafe();
    const connection = solana?.connection ?? null;

    const borrow = useCallback(async (params: SolanaBorrowParams) => {
        setIsPending(true);
        setCurrentStep(SolanaBorrowStep.VALIDATING);
        setError(null);
        setTxHash(null);

        try {
            // ── 1. Validate ──────────────────────────────────
            if (!connection) throw new Error('Solana connection not available');
            if (!params.wallet?.address) throw new Error('Wallet not connected');

            const amountNum = parseFloat(params.amount);
            if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid borrow amount');

            const assetMint = getTokenMint(params.tokenSymbol);
            if (!assetMint) throw new Error(`Unknown token: ${params.tokenSymbol}`);

            const lendingPool = getLendingPoolAddress(params.tokenSymbol);
            if (!lendingPool) throw new Error(`No lending pool for: ${params.tokenSymbol}`);

            const borrowOracle = getOracleAddress(params.tokenSymbol);
            if (!borrowOracle) throw new Error(`No oracle for: ${params.tokenSymbol}`);

            // ── 2. Resolve accounts ──────────────────────────
            const decimals = params.decimals ?? 6;
            const borrowAmountRaw = new BN(Math.floor(amountNum * 10 ** decimals));

            const anchorWallet = createAnchorWallet(params.wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const borrowerPubkey = anchorWallet.publicKey;

            const userTokenAccount = getATA(assetMint, borrowerPubkey);
            const [poolVault] = derivePoolVault(assetMint);
            const [userBalance] = deriveUserBalance(borrowerPubkey);

            // ── 3. Validate collateral account exists ────────
            const balanceInfo = await connection.getAccountInfo(userBalance);
            if (!balanceInfo) {
                throw new Error('No deposit account found. Please deposit before borrowing.');
            }

            // ── 4. Create user ATA if missing (separate tx) ──
            const ataInfo = await connection.getAccountInfo(userTokenAccount);
            if (ataInfo === null) {
                console.log('[borrow-debug] ATA missing — creating separately:', userTokenAccount.toBase58());
                const ataTx = new Transaction();
                ataTx.add(createAtaInstruction(borrowerPubkey, userTokenAccount, borrowerPubkey, assetMint));
                await sendAndConfirm(connection, anchorWallet, ataTx, borrowerPubkey);
                console.log('[borrow-debug] ATA created');
            }

            console.log('[borrow-debug] accounts', {
                borrower: borrowerPubkey.toBase58(),
                userTokenAccount: userTokenAccount.toBase58(),
                lendingPool: lendingPool.toBase58(),
                poolVault: poolVault.toBase58(),
                userBalance: userBalance.toBase58(),
                borrowOracle: borrowOracle.toBase58(),
                amountRaw: borrowAmountRaw.toString(),
            });

            // ── 5. Ensure fresh stub oracle (devnet) ─────────
            // The hardcoded oracle may be owned by the deployer and stale.
            // Derive a user-owned stub oracle — create if needed, then refresh.
            const [stubOraclePda] = deriveStubOracle(borrowerPubkey, assetMint);
            const stubOracleInfo = await connection.getAccountInfo(stubOraclePda);

            if (!stubOracleInfo) {
                console.log('[borrow-debug] Creating user-owned stub oracle...');
                const createOracleTx: Transaction = await program.methods
                    .stubOracleCreate(1.0)
                    .accountsStrict({
                        payer: borrowerPubkey,
                        owner: borrowerPubkey,
                        oracle: stubOraclePda,
                        mint: assetMint,
                        systemProgram: SystemProgram.programId,
                    })
                    .transaction();
                await sendAndConfirm(connection, anchorWallet, createOracleTx, borrowerPubkey);
                console.log('[borrow-debug] Stub oracle created:', stubOraclePda.toBase58());
            } else {
                console.log('[borrow-debug] Refreshing stub oracle price...');
                const refreshTx: Transaction = await program.methods
                    .stubOracleSet(1.0)
                    .accountsStrict({
                        owner: borrowerPubkey,
                        oracle: stubOraclePda,
                    })
                    .transaction();
                await sendAndConfirm(connection, anchorWallet, refreshTx, borrowerPubkey);
                console.log('[borrow-debug] Oracle price refreshed');
            }

            // Use the user's own oracle for the borrow instruction
            const activeBorrowOracle = stubOraclePda;

            // ── 6. Build borrow tx ───────────────────────────
            setCurrentStep(SolanaBorrowStep.BORROWING);

            const tx: Transaction = await program.methods
                .borrow(borrowAmountRaw)
                .accountsStrict({
                    borrower: borrowerPubkey,
                    userTokenAccount,
                    assetMint,
                    lendingPool,
                    poolVault,
                    userBalance,
                    borrowOracle: activeBorrowOracle,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .transaction();

            // ── 6. Send + confirm ────────────────────────────
            setCurrentStep(SolanaBorrowStep.CONFIRMING);
            const signature = await sendAndConfirm(connection, anchorWallet, tx, borrowerPubkey);

            setTxHash(signature);

            // ── 7. Wait for indexer to process (3–10s latency) ──
            setCurrentStep(SolanaBorrowStep.SYNCING);
            await new Promise(resolve => setTimeout(resolve, 4000));

            setCurrentStep(SolanaBorrowStep.COMPLETED);
            setIsPending(false);
            onSuccess?.(signature);
        } catch (err) {
            const borrowError = err instanceof Error ? err : new Error('Solana borrow failed');
            setError(borrowError);
            setCurrentStep(SolanaBorrowStep.ERROR);
            setIsPending(false);
            onError?.(borrowError);
        }
    }, [connection, onSuccess, onError]);

    return {
        borrow,
        isPending,
        isConfirming: currentStep === SolanaBorrowStep.CONFIRMING,
        isConfirmed: currentStep === SolanaBorrowStep.COMPLETED,
        currentStep,
        error,
        txHash,
    };
}

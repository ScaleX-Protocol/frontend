/**
 * Anchor Program Client — Shared factory for the OpenBook V2 program
 *
 * Creates an Anchor Program instance using:
 * - Connection from SolanaProvider (via useSolana())
 * - Privy embedded wallet for signing (via useSolanaWallets())
 *
 * Usage:
 *   const { program, provider } = useOpenbookProgram();
 *   await program.methods.deposit(baseAmount, quoteAmount).accounts({...}).rpc();
 */

import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { OpenbookV2IDL } from '@/idl/openbook_v2';

// ─── Wallet Adapter Interface ─────────────────────────────────────────

/**
 * Minimal wallet interface that Anchor requires.
 * This bridges Privy's ConnectedSolanaWallet → AnchorProvider.wallet
 */
export interface AnchorWallet {
    publicKey: PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}

// ─── Program Factory ──────────────────────────────────────────────────

/**
 * Create an Anchor Program instance for the OpenBook V2 program.
 *
 * @param connection - Solana RPC connection (from SolanaProvider)
 * @param wallet - Wallet adapter (from createAnchorWallet)
 * @returns { program, provider } — the Anchor program and provider
 */
export function createOpenbookProgram(connection: Connection, wallet: AnchorWallet) {
    const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
    });

    const program = new Program(
        OpenbookV2IDL as unknown as Idl,
        provider,
    );

    return { program, provider };
}

// ─── Privy Wallet → Anchor Wallet Adapter ─────────────────────────────

/**
 * Adapt a Privy ConnectedSolanaWallet into the AnchorWallet interface.
 *
 * Privy's wallet.signTransaction/signAllTransactions are compatible
 * but the wallet object needs to be wrapped to expose publicKey as PublicKey.
 *
 * @param privyWallet - A connected Privy Solana wallet
 * @returns AnchorWallet compatible with AnchorProvider
 */
export function createAnchorWallet(privyWallet: {
    address: string;
    signTransaction: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
}): AnchorWallet {
    return {
        publicKey: new PublicKey(privyWallet.address),
        signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
            return (await privyWallet.signTransaction(tx)) as T;
        },
        signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
            // Privy doesn't expose signAllTransactions, so we sign one-by-one
            const signed: T[] = [];
            for (const tx of txs) {
                signed.push((await privyWallet.signTransaction(tx)) as T);
            }
            return signed;
        },
    };
}

// ─── Transaction Confirmation Helper ──────────────────────────────────

/**
 * Send and confirm a transaction with retry logic.
 *
 * @param connection - Solana RPC connection
 * @param tx - Signed transaction (serialized)
 * @param commitment - Confirmation commitment level
 * @returns Transaction signature
 */
export async function sendAndConfirmTransaction(
    connection: Connection,
    rawTransaction: Uint8Array,
    commitment: 'confirmed' | 'finalized' = 'confirmed'
): Promise<string> {
    const txSignature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: commitment,
    });

    // Wait for confirmation
    const latestBlockhash = await connection.getLatestBlockhash(commitment);
    const confirmation = await connection.confirmTransaction(
        {
            signature: txSignature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        commitment
    );

    if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return txSignature;
}

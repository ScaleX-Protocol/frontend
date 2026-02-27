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
import { SolanaConfig } from '@/configs/solana';

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
 * Privy's ConnectedStandardSolanaWallet.signTransaction follows the Wallet Standard:
 * it expects { transaction: Uint8Array, chain: 'solana:devnet' }, NOT a web3.js Transaction.
 * We serialize before calling Privy and deserialize the result back for Anchor.
 *
 * @param privyWallet - A connected Privy Solana wallet (ConnectedStandardSolanaWallet)
 * @returns AnchorWallet compatible with AnchorProvider
 */
export function createAnchorWallet(privyWallet: {
    address: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signTransaction: (...args: any[]) => Promise<any>;
}): AnchorWallet {
    const sign = async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
        const isVersioned = tx instanceof VersionedTransaction;

        // Serialize to wire-format bytes — Wallet Standard requires Uint8Array, not web3.js Transaction
        const txBytes: Uint8Array = isVersioned
            ? (tx as VersionedTransaction).serialize()
            : (tx as Transaction).serialize({ requireAllSignatures: false });

        // Call Privy signTransaction with Wallet Standard format.
        // Must pass chain explicitly: Privy defaults to 'solana:mainnet', which causes
        // its signing modal to simulate against mainnet. We force devnet so Privy
        // uses our configured Helius devnet RPC for simulation.
        const result = await privyWallet.signTransaction({
            transaction: txBytes,
            chain: SolanaConfig.chainId, // 'solana:devnet'
        });

        // result.signedTransaction is Uint8Array — deserialize back to web3.js for Anchor
        const signedBytes: Uint8Array = result.signedTransaction;
        if (isVersioned) {
            return VersionedTransaction.deserialize(signedBytes) as T;
        }
        return Transaction.from(signedBytes) as T;
    };

    return {
        publicKey: new PublicKey(privyWallet.address),
        signTransaction: sign,
        signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
            return Promise.all(txs.map(sign));
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

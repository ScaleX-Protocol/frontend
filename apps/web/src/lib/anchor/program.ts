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

        // Serialize to wire-format bytes — Privy requires { transaction: Uint8Array, chain }
        const txBytes: Uint8Array = isVersioned
            ? (tx as VersionedTransaction).serialize()
            : (tx as Transaction).serialize({ requireAllSignatures: false });

        console.log('[createAnchorWallet] sign() called', {
            wallet: privyWallet.address,
            isVersioned,
            txBytesType: typeof txBytes,
            txBytesLength: txBytes?.length,
            chain: SolanaConfig.chainId,
            signTransactionType: typeof privyWallet.signTransaction,
        });

        // Call Privy signTransaction with the Wallet Standard bytes format.
        const result = await privyWallet.signTransaction({
            transaction: txBytes,
            chain: SolanaConfig.chainId, // 'solana:devnet'
        });

        console.log('[createAnchorWallet] signTransaction result', {
            resultType: typeof result,
            isNull: result === null,
            isUndefined: result === undefined,
            keys: result && typeof result === 'object' ? Object.keys(result) : [],
            hasSignedTransaction: !!(result as Record<string, unknown>)?.signedTransaction,
            signedTransactionType: typeof (result as Record<string, unknown>)?.signedTransaction,
            isUint8Array: result instanceof Uint8Array,
            isTransaction: result instanceof Transaction,
            isVersionedTx: result instanceof VersionedTransaction,
        });

        // Resolve the signed bytes — Privy may return in different shapes:
        //   { signedTransaction: Uint8Array }  — Wallet Standard / Privy standard
        //   { transaction: Uint8Array }         — some Privy versions / adapters
        //   Uint8Array                          — result IS the bytes directly
        //   Transaction | VersionedTransaction  — web3.js object (some adapters)
        let signedBytes: Uint8Array | undefined;

        if (result?.signedTransaction) {
            signedBytes = result.signedTransaction as Uint8Array;
        } else if (result?.transaction instanceof Uint8Array) {
            signedBytes = result.transaction;
        } else if (result instanceof Uint8Array) {
            signedBytes = result;
        } else if (!isVersioned && result instanceof Transaction) {
            return result as T;
        } else if (isVersioned && result instanceof VersionedTransaction) {
            return result as T;
        }

        if (!signedBytes) {
            throw new Error(
                `Wallet signTransaction returned unexpected format. ` +
                `Expected { signedTransaction: Uint8Array }, { transaction: Uint8Array }, Uint8Array, or Transaction. ` +
                `Got: ${JSON.stringify(result)}`
            );
        }

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

'use client';

/**
 * Solana Balance Hook — Real SPL Token Balance Queries
 *
 * Fetches SPL token balances for a user's Associated Token Account (ATA).
 * Also supports fetching native SOL balance when tokenMint is null.
 *
 * Uses:
 * - @solana/spl-token: getAssociatedTokenAddressSync, getAccount
 * - SolanaProvider: for the Connection instance
 * - Auto-polling: refreshes balance on configurable interval
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';
import { useSolanaSafe } from '@/providers/SolanaProvider';
import { SolanaConfig } from '@/configs/solana';

const isRateLimitError = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.toLowerCase().includes('rate limit') || msg.includes('-32429');
};

const getTokenBalance = async (connection: Connection, ata: PublicKey): Promise<bigint> => {
    const account = await getAccount(connection, ata);
    return account.amount;
};

interface UseSolanaBalanceParams {
    /** Solana pubkey (Base58) of the user */
    userAddress?: string;
    /** SPL token mint address. If undefined/null, fetches native SOL balance */
    tokenMint?: string | null;
    /** Token decimals (default: 9 for SOL) */
    decimals?: number;
    /** Whether to enable fetching (default: true) */
    enabled?: boolean;
    /** Polling interval in ms (default: 0 = fetch once, no polling) */
    pollingInterval?: number;
}

export function useSolanaBalance({
    userAddress,
    tokenMint,
    decimals = 9,
    enabled = true,
    pollingInterval = 0,
}: UseSolanaBalanceParams) {
    const [rawBalance, setRawBalance] = useState<bigint | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    /** Tracks the last (address, tokenMint) key we successfully fetched for in fetch-once mode */
    const fetchedKeyRef = useRef<string | null>(null);

    const solana = useSolanaSafe();
    const connection = solana?.connection ?? null;

    const fetchBalance = useCallback(async () => {
        if (!userAddress || !enabled || !connection) {
            setRawBalance(undefined);
            return;
        }

        // Fetch-once mode: skip if already fetched for this (address, tokenMint) pair
        const fetchKey = `${userAddress}:${tokenMint ?? 'sol'}`;
        if (pollingInterval === 0 && fetchedKeyRef.current === fetchKey) return;

        try {
            setIsLoading(true);
            setError(null);

            const ownerPubkey = new PublicKey(userAddress);

            if (!tokenMint) {
                // Fetch native SOL balance
                const lamports = await connection.getBalance(ownerPubkey);
                setRawBalance(BigInt(lamports));
            } else {
                // Fetch SPL token balance via ATA
                const mintPubkey = new PublicKey(tokenMint);
                const ata = getAssociatedTokenAddressSync(mintPubkey, ownerPubkey);

                // Try primary connection, then fallbacks if rate-limited
                const connectionsToTry = [
                    connection,
                    ...SolanaConfig.fallbackRpcUrls.map((url) => new Connection(url, 'confirmed')),
                ];
                let lastErr: unknown;
                let fetched = false;
                for (const conn of connectionsToTry) {
                    try {
                        setRawBalance(await getTokenBalance(conn, ata));
                        fetched = true;
                        break;
                    } catch (err) {
                        if (err instanceof TokenAccountNotFoundError) {
                            setRawBalance(BigInt(0));
                            fetched = true;
                            break;
                        }
                        lastErr = err;
                        if (!isRateLimitError(err)) throw err;
                        // rate limited — try next connection
                    }
                }
                if (!fetched) throw lastErr;
            }

            // Mark this key as fetched (fetch-once mode guard)
            fetchedKeyRef.current = fetchKey;
        } catch (err) {
            const balanceError = err instanceof Error ? err : new Error('Failed to fetch Solana balance');
            setError(balanceError);
            setRawBalance(undefined);
        } finally {
            setIsLoading(false);
        }
    }, [connection, userAddress, tokenMint, enabled, pollingInterval]);

    // Initial fetch + polling
    useEffect(() => {
        fetchBalance();

        if (enabled && pollingInterval > 0) {
            intervalRef.current = setInterval(fetchBalance, pollingInterval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [fetchBalance, enabled, pollingInterval]);

    // Compute formatted values
    const formattedBalance = rawBalance !== undefined
        ? Number(rawBalance) / 10 ** decimals
        : 0;

    const formattedString = formattedBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: Math.min(decimals, 6),
    });

    return {
        /** Raw balance as bigint (in smallest unit, e.g. lamports) */
        rawBalance,
        /** Balance as a number (human-readable, e.g. 1.5 SOL) */
        formattedBalance,
        /** Locale-formatted string (e.g. "1,234.56") */
        formattedString,
        /** Whether a fetch is in progress */
        isLoading,
        /** Last error, if any */
        error,
        /** Manually trigger a re-fetch */
        refetch: fetchBalance,
    };
}

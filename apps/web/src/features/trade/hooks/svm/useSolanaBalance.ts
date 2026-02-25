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
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';
import { useSolanaSafe } from '@/providers/SolanaProvider';

interface UseSolanaBalanceParams {
    /** Solana pubkey (Base58) of the user */
    userAddress?: string;
    /** SPL token mint address. If undefined/null, fetches native SOL balance */
    tokenMint?: string | null;
    /** Token decimals (default: 9 for SOL) */
    decimals?: number;
    /** Whether to enable fetching (default: true) */
    enabled?: boolean;
    /** Polling interval in ms (default: 15000) */
    pollingInterval?: number;
}

export function useSolanaBalance({
    userAddress,
    tokenMint,
    decimals = 9,
    enabled = true,
    pollingInterval = 15000,
}: UseSolanaBalanceParams) {
    const [rawBalance, setRawBalance] = useState<bigint | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const solana = useSolanaSafe();
    const connection = solana?.connection ?? null;

    const fetchBalance = useCallback(async () => {
        if (!userAddress || !enabled || !connection) {
            setRawBalance(undefined);
            return;
        }

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

                try {
                    const account = await getAccount(connection, ata);
                    setRawBalance(account.amount);
                } catch (err) {
                    if (err instanceof TokenAccountNotFoundError) {
                        // ATA doesn't exist — balance is 0
                        setRawBalance(BigInt(0));
                    } else {
                        throw err;
                    }
                }
            }
        } catch (err) {
            const balanceError = err instanceof Error ? err : new Error('Failed to fetch Solana balance');
            setError(balanceError);
            setRawBalance(undefined);
        } finally {
            setIsLoading(false);
        }
    }, [connection, userAddress, tokenMint, enabled]);

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

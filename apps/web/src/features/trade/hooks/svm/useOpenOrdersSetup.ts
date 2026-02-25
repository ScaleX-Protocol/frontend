'use client';

/**
 * OpenOrders Account Setup Hook
 *
 * Manages the lifecycle of OpenBook V2 trading accounts:
 * 1. Checks if user has an OpenOrdersIndexer (one per user)
 * 2. Checks if user has an OpenOrdersAccount (one per user per market)
 * 3. Creates them if they don't exist
 *
 * This must be called BEFORE placing orders — the OpenOrdersAccount is
 * required by the placeOrder instruction.
 *
 * On-chain instructions used:
 *   createOpenOrdersIndexer()
 *   createOpenOrdersAccount(name: string)
 */

import { useState, useCallback, useEffect } from 'react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useSolana } from '@/providers/SolanaProvider';
import {
    createOpenbookProgram,
    createAnchorWallet,
    resolveOpenOrders,
} from '@/lib/anchor';
import {
    deriveOpenOrdersIndexer,
    deriveOpenOrdersAccount,
    deriveEventAuthority,
} from '@/lib/anchor/pda';
import { OPENBOOK_PROGRAM_ID } from '@/lib/anchor/constants';

export enum OpenOrdersSetupStatus {
    /** Haven't checked yet */
    UNKNOWN = 'unknown',
    /** Currently checking on-chain state */
    CHECKING = 'checking',
    /** Both indexer and account exist — ready to trade */
    READY = 'ready',
    /** Indexer and/or account missing — needs setup */
    NEEDS_SETUP = 'needs_setup',
    /** Currently creating accounts */
    CREATING = 'creating',
    /** Error during check or creation */
    ERROR = 'error',
}

interface UseOpenOrdersSetupParams {
    /** Market address (required to create the OpenOrdersAccount) */
    marketAddress: string;
    /** Privy wallet object */
    wallet?: {
        address: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signTransaction: (tx: any) => Promise<any>;
    };
    /** Whether to auto-check on mount (default: true) */
    autoCheck?: boolean;
}

export function useOpenOrdersSetup({
    marketAddress,
    wallet,
    autoCheck = true,
}: UseOpenOrdersSetupParams) {
    const [status, setStatus] = useState<OpenOrdersSetupStatus>(OpenOrdersSetupStatus.UNKNOWN);
    const [indexerExists, setIndexerExists] = useState(false);
    const [accountExists, setAccountExists] = useState(false);
    const [openOrdersAccount, setOpenOrdersAccount] = useState<PublicKey | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const { connection } = useSolana();

    /**
     * Check if the user's OpenOrdersIndexer and OpenOrdersAccount exist on-chain.
     */
    const checkAccounts = useCallback(async () => {
        if (!wallet?.address) {
            setStatus(OpenOrdersSetupStatus.UNKNOWN);
            return;
        }

        try {
            setStatus(OpenOrdersSetupStatus.CHECKING);
            setError(null);

            const ownerPubkey = new PublicKey(wallet.address);
            const info = await resolveOpenOrders(connection, ownerPubkey, 0);

            setIndexerExists(info.indexerExists);
            setAccountExists(info.openOrdersExists);
            setOpenOrdersAccount(info.openOrdersAccount);

            if (info.indexerExists && info.openOrdersExists) {
                setStatus(OpenOrdersSetupStatus.READY);
            } else {
                setStatus(OpenOrdersSetupStatus.NEEDS_SETUP);
            }
        } catch (err) {
            const setupError = err instanceof Error ? err : new Error('Failed to check open orders');
            setError(setupError);
            setStatus(OpenOrdersSetupStatus.ERROR);
        }
    }, [connection, wallet?.address]);

    /**
     * Create the OpenOrdersIndexer and/or OpenOrdersAccount if missing.
     */
    const setupAccounts = useCallback(async () => {
        if (!wallet?.address) {
            throw new Error('Wallet not connected');
        }

        try {
            setStatus(OpenOrdersSetupStatus.CREATING);
            setError(null);

            const anchorWallet = createAnchorWallet(wallet);
            const { program } = createOpenbookProgram(connection, anchorWallet);
            const ownerPubkey = anchorWallet.publicKey;
            const marketPubkey = new PublicKey(marketAddress);

            // Step 1: Create OpenOrdersIndexer if needed
            if (!indexerExists) {
                const [indexer] = deriveOpenOrdersIndexer(ownerPubkey);
                await program.methods
                    .createOpenOrdersIndexer()
                    .accounts({
                        payer: ownerPubkey,
                        owner: ownerPubkey,
                        openOrdersIndexer: indexer,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
                setIndexerExists(true);
            }

            // Step 2: Create OpenOrdersAccount if needed
            if (!accountExists) {
                const [indexer] = deriveOpenOrdersIndexer(ownerPubkey);
                const [ooa] = deriveOpenOrdersAccount(ownerPubkey, 0);
                const [eventAuthority] = deriveEventAuthority();

                await program.methods
                    .createOpenOrdersAccount('default')
                    .accounts({
                        payer: ownerPubkey,
                        owner: ownerPubkey,
                        delegateAccount: PublicKey.default,
                        openOrdersIndexer: indexer,
                        openOrdersAccount: ooa,
                        market: marketPubkey,
                        systemProgram: SystemProgram.programId,
                        program: OPENBOOK_PROGRAM_ID,
                        eventAuthority,
                    })
                    .rpc();

                setAccountExists(true);
                setOpenOrdersAccount(ooa);
            }

            setStatus(OpenOrdersSetupStatus.READY);
        } catch (err) {
            const setupError = err instanceof Error ? err : new Error('Failed to create open orders accounts');
            setError(setupError);
            setStatus(OpenOrdersSetupStatus.ERROR);
            throw setupError;
        }
    }, [connection, wallet, marketAddress, indexerExists, accountExists]);

    /**
     * Convenience: check + setup in one call.
     * Returns the OpenOrdersAccount public key when ready.
     */
    const ensureReady = useCallback(async (): Promise<PublicKey> => {
        await checkAccounts();

        // Re-read state after check (status may have changed)
        if (!indexerExists || !accountExists) {
            await setupAccounts();
        }

        // After setup, derive again to return the correct PDA
        if (!wallet?.address) throw new Error('Wallet not connected');
        const [ooa] = deriveOpenOrdersAccount(new PublicKey(wallet.address), 0);
        return ooa;
    }, [checkAccounts, setupAccounts, indexerExists, accountExists, wallet?.address]);

    // Auto-check on mount if enabled
    useEffect(() => {
        if (autoCheck && wallet?.address) {
            checkAccounts();
        }
    }, [autoCheck, wallet?.address, checkAccounts]);

    return {
        /** Current setup status */
        status,
        /** Whether the user is ready to trade */
        isReady: status === OpenOrdersSetupStatus.READY,
        /** Whether accounts are being created */
        isCreating: status === OpenOrdersSetupStatus.CREATING,
        /** Whether the indexer exists */
        indexerExists,
        /** Whether the open orders account exists */
        accountExists,
        /** The OpenOrdersAccount PDA (null if not resolved) */
        openOrdersAccount,
        /** Last error */
        error,
        /** Check if accounts exist */
        checkAccounts,
        /** Create missing accounts */
        setupAccounts,
        /** Check + create in one call */
        ensureReady,
    };
}

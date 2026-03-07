/**
 * Anchor Types — Re-exports for convenience
 *
 * Single import point for all Anchor-related types, constants, and utilities.
 *
 * Usage:
 *   import { Side, PlaceOrderType, OPENBOOK_PROGRAM_ID, createOpenbookProgram } from '@/lib/anchor';
 */

// IDL types and helpers
export {
    OpenbookV2IDL,
    PROGRAM_NAME,
    Side,
    PlaceOrderType,
    SelfTradeBehavior,
    sideToAnchor,
    orderTypeToAnchor,
    selfTradeBehaviorToAnchor,
} from '@/idl/openbook_v2';

export type {
    PlaceOrderArgs,
    PlaceOrderArgsBN,
    LendingPoolParams,
} from '@/idl/openbook_v2';

// Program client
export {
    createOpenbookProgram,
    createAnchorWallet,
    sendAndConfirmTransaction,
} from './program';

export type { AnchorWallet } from './program';

// Constants
export {
    OPENBOOK_PROGRAM_ID,
    TOKEN_MINTS,
    MARKET_ADDRESSES,
    ORACLE_ADDRESSES,
    LENDING_POOL_ADDRESSES,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getTokenMint,
    getMarketAddress,
    getOracleAddress,
    getLendingPoolAddress,
} from './constants';

// PDA derivation
export {
    deriveMarketAuthority,
    deriveOpenOrdersIndexer,
    deriveOpenOrdersAccount,
    deriveEventAuthority,
    deriveUserCollateral,
    deriveUserBalance,
    derivePoolVault,
} from './pda';

// Account resolution
export {
    resolveMarketAccounts,
    resolveOpenOrders,
    getUserTokenAccount,
    resolveLendingAccounts,
    resolvePlaceOrderAccounts,
} from './accounts';

export type {
    MarketAccounts,
    OpenOrdersInfo,
    LendingAccounts,
    PlaceOrderAccounts,
} from './accounts';

/**
 * OpenBook V2 IDL TypeScript Export
 *
 * This file re-exports the IDL JSON as a typed constant and
 * provides the generated TypeScript type for the program.
 *
 * Usage:
 *   import { OpenbookV2IDL } from '@/idl/openbook_v2';
 *   import type { OpenbookV2 } from '@/idl/openbook_v2';
 */

import type { Idl } from '@coral-xyz/anchor';
import _idl from './openbook_v2.json';

// Re-export the JSON IDL with proper typing
export const OpenbookV2IDL = _idl as Idl;

// Program name constant
export const PROGRAM_NAME = 'openbook_v2' as const;

// ─── Instruction Argument Types ───────────────────────────────────────

/** Side enum matching on-chain Side */
export enum Side {
    Bid = 0,
    Ask = 1,
}

/** PlaceOrderType enum matching on-chain PlaceOrderType */
export enum PlaceOrderType {
    Limit = 0,
    ImmediateOrCancel = 1,
    PostOnly = 2,
    Market = 3,
    PostOnlySlide = 4,
    FillOrKill = 5,
}

/** SelfTradeBehavior enum matching on-chain SelfTradeBehavior */
export enum SelfTradeBehavior {
    DecrementTake = 0,
    CancelProvide = 1,
    AbortTransaction = 2,
}

/** PlaceOrderArgs — the main argument struct for placeOrder instruction */
export interface PlaceOrderArgs {
    side: Side;
    priceLots: bigint;               // i64 on-chain
    maxBaseLots: bigint;             // i64 on-chain
    maxQuoteLotsIncludingFees: bigint; // i64 on-chain
    clientOrderId: bigint;           // u64 on-chain
    orderType: PlaceOrderType;
    expiryTimestamp: bigint;         // u64 on-chain, 0 = never expire
    selfTradeBehavior: SelfTradeBehavior;
    limit: number;                   // u8 on-chain
}

/** LendingPoolParams — used for initializeLendingPool / configureLendingPool */
export interface LendingPoolParams {
    baseRate: bigint;
    optimalUtilization: bigint;
    rateSlope1: bigint;
    rateSlope2: bigint;
    reserveFactor: bigint;
    collateralFactor: bigint;
    liquidationThreshold: bigint;
    liquidationBonus: bigint;
    depositLimit: bigint;
    borrowLimit: bigint;
}

// ─── Anchor BN Versions (for use with Anchor methods) ─────────────────

import { BN } from '@coral-xyz/anchor';

/** PlaceOrderArgs using Anchor BN (for program.methods calls) */
export interface PlaceOrderArgsBN {
    side: { bid: {} } | { ask: {} };
    priceLots: BN;
    maxBaseLots: BN;
    maxQuoteLotsIncludingFees: BN;
    clientOrderId: BN;
    orderType:
    | { limit: {} }
    | { immediateOrCancel: {} }
    | { postOnly: {} }
    | { market: {} }
    | { postOnlySlide: {} }
    | { fillOrKill: {} };
    expiryTimestamp: BN;
    selfTradeBehavior:
    | { decrementTake: {} }
    | { cancelProvide: {} }
    | { abortTransaction: {} };
    limit: number;
}

/** Helper: convert Side enum to Anchor-compatible variant */
export function sideToAnchor(side: Side): { bid: {} } | { ask: {} } {
    return side === Side.Bid ? { bid: {} } : { ask: {} };
}

/** Helper: convert PlaceOrderType enum to Anchor-compatible variant */
export function orderTypeToAnchor(
    orderType: PlaceOrderType
): PlaceOrderArgsBN['orderType'] {
    switch (orderType) {
        case PlaceOrderType.Limit:
            return { limit: {} };
        case PlaceOrderType.ImmediateOrCancel:
            return { immediateOrCancel: {} };
        case PlaceOrderType.PostOnly:
            return { postOnly: {} };
        case PlaceOrderType.Market:
            return { market: {} };
        case PlaceOrderType.PostOnlySlide:
            return { postOnlySlide: {} };
        case PlaceOrderType.FillOrKill:
            return { fillOrKill: {} };
    }
}

/** Helper: convert SelfTradeBehavior enum to Anchor-compatible variant */
export function selfTradeBehaviorToAnchor(
    behavior: SelfTradeBehavior
): PlaceOrderArgsBN['selfTradeBehavior'] {
    switch (behavior) {
        case SelfTradeBehavior.DecrementTake:
            return { decrementTake: {} };
        case SelfTradeBehavior.CancelProvide:
            return { cancelProvide: {} };
        case SelfTradeBehavior.AbortTransaction:
            return { abortTransaction: {} };
    }
}

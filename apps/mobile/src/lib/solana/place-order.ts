/**
 * Build place order and place take order instructions.
 */
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
import {
  createOpenBookClient,
  poolToMarketSymbol,
  Market,
} from './openbook-client';
import { SOLANA_CONFIG } from '../../config/solana';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { ensureOpenOrdersForMarket } from './onboarding';
import { buildBorrowIxs } from './lending';
import type { Pool } from './types';
import { SideUtils, PlaceOrderTypeUtils } from '@openbook-dex/openbook-v2';
import type { OrderSide, TimeInForce } from '../../hooks/trading/usePrivyPlaceOrder';

const OPENBOOK_MAX_LOTS = new BN("922337203685477580"); // MAX_LOTS used internally by OpenBook v2 rust program

function toOpenBookSide(side: OrderSide) {
  return side === 0 ? SideUtils.Bid : SideUtils.Ask;
}

function toPlaceOrderType(timeInForce: TimeInForce, isMarket: boolean) {
  if (isMarket) return PlaceOrderTypeUtils.Market;
  switch (timeInForce) {
    case 1:
      return PlaceOrderTypeUtils.ImmediateOrCancel;
    case 2:
      return PlaceOrderTypeUtils.FillOrKill;
    case 3:
      return PlaceOrderTypeUtils.PostOnly;
    default:
      return PlaceOrderTypeUtils.Limit;
  }
}

export interface PlaceLimitOrderParams {
  pool: Pool;
  price: string;
  quantity: string;
  side: OrderSide;
  timeInForce: TimeInForce;
  owner: PublicKey;
  quantityDecimals?: number;
  priceDecimals?: number;
  clientOrderId?: number;
  autoBorrow?: boolean;
  autoRepay?: boolean;
  collateralMints?: string[];
}

export interface PlaceMarketOrderParams {
  pool: Pool;
  quantity: string;
  side: OrderSide;
  owner: PublicKey;
  quantityDecimals?: number;
  limit?: number;
  autoBorrow?: boolean;
  autoRepay?: boolean;
  collateralMints?: string[];
}

/**
 * Build instructions for a limit order (maker order, added to book).
 */
export async function buildPlaceLimitOrderIxs(
  params: PlaceLimitOrderParams
): Promise<TransactionInstruction[]> {
  const { pool, price, quantity, side, timeInForce, owner, autoBorrow, autoRepay, collateralMints = [] } = params;
  const marketSymbol = poolToMarketSymbol(pool.base, pool.quote);
  const marketPk = new PublicKey(SOLANA_CONFIG.markets[marketSymbol]);

  const { openOrdersAccount, instructions } = await ensureOpenOrdersForMarket(
    owner,
    pool
  );

  const client = createOpenBookClient(owner);
  const market = await Market.load(client, marketPk);

  const baseMint = market.account.baseMint;
  const quoteMint = market.account.quoteMint;
  const mint = side === 0 ? quoteMint : baseMint; // BUY uses quote, SELL uses base
  const userTokenAccount = getAssociatedTokenAddressSync(mint, owner);

  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenAccount,
      owner,
      mint
    )
  );

  const uiBaseAmount = parseFloat(quantity);
  const uiPrice = parseFloat(price);

  const nativeBase = new BN(Math.round(uiBaseAmount * Math.pow(10, params.quantityDecimals ?? 6)));
  const maxBaseLots = nativeBase.div(market.account.baseLotSize);

  const quoteAtomsPerUiBase = new BN(Math.round(uiPrice * Math.pow(10, params.priceDecimals ?? 6)));
  const baseDecimalsMultiplier = new BN(10).pow(new BN(params.quantityDecimals ?? 6));
  const priceLotsNumerator = quoteAtomsPerUiBase.mul(market.account.baseLotSize);
  const priceLotsDenominator = market.account.quoteLotSize.mul(baseDecimalsMultiplier);
  const priceLots = priceLotsNumerator.div(priceLotsDenominator);

  const clientOrderId = new BN(params.clientOrderId ?? Date.now());
  const orderType = toPlaceOrderType(timeInForce, false);

  const args = {
    side: toOpenBookSide(side),
    priceLots,
    maxBaseLots,
    maxQuoteLotsIncludingFees: OPENBOOK_MAX_LOTS,
    clientOrderId,
    orderType,
    expiryTimestamp: new BN(0),
    selfTradeBehavior: { decrementTake: {} },
    limit: 16,
  };

  // ── Auto-borrow pre-step ──────────────────────────────────────────────────────
  // placeOrder and placeTakeOrder have DIFFERENT fixed account list sizes:
  //   placeTakeOrder: signer, market, bids, asks, eventHeap, baseVault, quoteVault,
  //                   userBase, userQuote, marketAuthority, tokenProgram  (11 keys)
  //   placeOrder:     signer, openOrdersAccount, openOrdersIndexer, market, bids,
  //                   asks, eventHeap, marketVault, userToken, tokenProgram  (10 keys)
  //
  // Appending lending accounts to placeOrder shifts their absolute positions vs
  // placeTakeOrder. The ScaleX program validates accounts at fixed absolute indices,
  // so it reads a token account where it expects a ScaleX PDA →
  // AccountOwnedByWrongProgram (0xbbf).
  //
  // Solution: for limit orders handle the borrow as a SEPARATE instruction that
  // runs before placeOrderIx. The placeOrderIx then executes as a plain order
  // using the wallet ATA that was just funded by the borrow step.
  if (autoBorrow) {
    const mintStr = mint.toBase58();
    const tokenSym = Object.keys(SOLANA_CONFIG.tokens).find(
      k => SOLANA_CONFIG.tokens[k as keyof typeof SOLANA_CONFIG.tokens] === mintStr
    );
    if (tokenSym) {
      // BUY (side=0): need quote tokens worth (price × quantity)
      // SELL (side=1): need base tokens worth (quantity)
      const borrowDecimals = side === 0 ? (params.priceDecimals ?? 6) : (params.quantityDecimals ?? 6);
      const borrowUiAmount = side === 0
        ? (uiBaseAmount * uiPrice).toFixed(borrowDecimals)
        : uiBaseAmount.toFixed(borrowDecimals);

      const borrowIxs = await buildBorrowIxs({
        tokenSymbol: tokenSym,
        amount: borrowUiAmount,
        owner,
        decimals: borrowDecimals,
        collateralMints,
      });
      instructions.push(...borrowIxs);
    } else {
      console.warn('[PlaceOrder] autoBorrow: unknown token mint', mintStr);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // PlaceOrder itself is now a plain order — no extra remaining accounts needed.
  const [placeIx] = await client.placeOrderIx(
    openOrdersAccount,
    marketPk,
    market.account,
    userTokenAccount,
    args,
    []
  );

  // Always append the 18-byte suffix the ScaleX program reads after the Anchor
  // instruction data. autoBorrow/autoRepay are 0 here because the borrow was
  // already handled above; all bytes are 0 (Buffer.alloc zeroes by default).
  const extraData = Buffer.alloc(18);
  placeIx.data = Buffer.concat([placeIx.data, extraData]);

  instructions.push(placeIx);
  return instructions;
}

/**
 * Build instructions for a market order (taker order, takes from book).
 * Uses placeTakeOrder - no OpenOrdersAccount needed.
 */
export async function buildPlaceMarketOrderIxs(
  params: PlaceMarketOrderParams
): Promise<TransactionInstruction[]> {
  const { pool, quantity, side, owner, limit = 16, autoBorrow, autoRepay, collateralMints = [] } = params;
  const marketSymbol = poolToMarketSymbol(pool.base, pool.quote);
  const marketPk = new PublicKey(SOLANA_CONFIG.markets[marketSymbol]);

  const client = createOpenBookClient(owner);
  const market = await Market.load(client, marketPk);

  const baseMint = market.account.baseMint;
  const quoteMint = market.account.quoteMint;
  const userBaseAccount = getAssociatedTokenAddressSync(baseMint, owner);
  const userQuoteAccount = getAssociatedTokenAddressSync(quoteMint, owner);

  const openBookSide = toOpenBookSide(side);
  
  // A market order must specify a price lots threshold. 
  // - If buying (Bid), we are willing to pay up to MAX price.
  // - If selling (Ask), we are willing to accept down to MIN price (1).
  const priceLots = openBookSide === SideUtils.Bid ? OPENBOOK_MAX_LOTS : new BN(1);
  const uiBaseAmount = parseFloat(quantity);
  const nativeBase = new BN(Math.round(uiBaseAmount * Math.pow(10, params.quantityDecimals ?? 6)));
  const maxBaseLots = nativeBase.div(market.account.baseLotSize);
  const orderType = PlaceOrderTypeUtils.Market;

  const args = {
    side: openBookSide,
    priceLots,
    maxBaseLots,
    maxQuoteLotsIncludingFees: OPENBOOK_MAX_LOTS,
    orderType,
    limit,
  };

  const ixs: TransactionInstruction[] = [];
  ixs.push(
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userBaseAccount,
      owner,
      baseMint
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userQuoteAccount,
      owner,
      quoteMint
    )
  );

  const [placeIx] = await client.placeTakeOrderIx(
    marketPk,
    market.account,
    userBaseAccount,
    userQuoteAccount,
    market.account.openOrdersAdmin.key.equals(PublicKey.default)
      ? null
      : market.account.openOrdersAdmin.key,
    args,
    []
  );

  // Append remainingAccounts dynamically for placeTakeOrderIx inside the returned transaction instruction list? 
  // placeTakeOrderIx already built the instruction. Let's append to its keys!
  if (autoBorrow || autoRepay) {
    const PROGRAM_ID = new PublicKey(SOLANA_CONFIG.programId);
    const mint = side === 0 ? quoteMint : baseMint;
    
    // Find lending pool address
    const { findLendingPoolAddress, findPoolVaultAddress, findUserCollateralAddress } = await import('./pdas');
    const [lendingPool] = findLendingPoolAddress(mint, PROGRAM_ID);
    const [poolVault] = findPoolVaultAddress(mint, PROGRAM_ID);
    const [userCollateral] = findUserCollateralAddress(owner, PROGRAM_ID);
    
    // Find borrow oracle
    const tokenSymbol = Object.keys(SOLANA_CONFIG.tokens).find(k => SOLANA_CONFIG.tokens[k as keyof typeof SOLANA_CONFIG.tokens] === mint.toBase58());
    const borrowOracleAddr = tokenSymbol ? SOLANA_CONFIG.oracles[tokenSymbol as keyof typeof SOLANA_CONFIG.oracles] : undefined;
    if (borrowOracleAddr) {
      placeIx.keys.push(
        { pubkey: lendingPool, isSigner: false, isWritable: true },
        { pubkey: poolVault, isSigner: false, isWritable: true },
        { pubkey: userCollateral, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(borrowOracleAddr), isSigner: false, isWritable: false }
      );
    }

    // Append collateral pools
    for (const collateralMint of collateralMints) {
      const colSymbol = Object.keys(SOLANA_CONFIG.tokens).find(k => SOLANA_CONFIG.tokens[k as keyof typeof SOLANA_CONFIG.tokens] === collateralMint);
      const colOracleAddr = colSymbol ? SOLANA_CONFIG.oracles[colSymbol as keyof typeof SOLANA_CONFIG.oracles] : undefined;
      if (colOracleAddr) {
        const [colPool] = findLendingPoolAddress(new PublicKey(collateralMint), PROGRAM_ID);
        placeIx.keys.push(
          { pubkey: colPool, isSigner: false, isWritable: false },
          { pubkey: new PublicKey(colOracleAddr), isSigner: false, isWritable: false }
        );
      }
    }
  }

  const extraData = Buffer.alloc(18);
  if (autoBorrow) {
    extraData.writeUInt8(1, 0); // autoBorrow = true
    extraData.writeBigUInt64LE(18446744073709551615n, 1); // borrowAmount = u64::MAX
  }
  if (autoRepay) {
    extraData.writeUInt8(1, 9); // autoRepay = true
    extraData.writeBigUInt64LE(18446744073709551615n, 10); // repayAmount = u64::MAX
  }
  placeIx.data = Buffer.concat([placeIx.data, extraData]);

  ixs.push(placeIx);

  return ixs;
}

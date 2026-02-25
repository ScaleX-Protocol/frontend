/**
 * Build place order and place take order instructions.
 */
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
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
import type { Pool } from './types';
import { SideUtils, PlaceOrderTypeUtils, I64_MAX_BN } from '@openbook-dex/openbook-v2';
import type { OrderSide, TimeInForce } from '../types/order-enums';

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
}

export interface PlaceMarketOrderParams {
  pool: Pool;
  quantity: string;
  side: OrderSide;
  owner: PublicKey;
  quantityDecimals?: number;
  limit?: number;
}

/**
 * Build instructions for a limit order (maker order, added to book).
 */
export async function buildPlaceLimitOrderIxs(
  params: PlaceLimitOrderParams
): Promise<TransactionInstruction[]> {
  const { pool, price, quantity, side, timeInForce, owner } = params;
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

  const priceLots = market.priceUiToLots(parseFloat(price));
  const maxBaseLots = market.baseUiToLots(parseFloat(quantity));
  const clientOrderId = new BN(params.clientOrderId ?? Date.now());
  const orderType = toPlaceOrderType(timeInForce, false);

  const args = {
    side: toOpenBookSide(side),
    priceLots,
    maxBaseLots,
    maxQuoteLotsIncludingFees: I64_MAX_BN,
    clientOrderId,
    orderType,
    expiryTimestamp: new BN(0),
    selfTradeBehavior: { decrementTake: {} },
    limit: 16,
  };

  const [placeIx] = await client.placeOrderIx(
    openOrdersAccount,
    marketPk,
    market.account,
    userTokenAccount,
    args,
    []
  );

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
  const { pool, quantity, side, owner, limit = 16 } = params;
  const marketSymbol = poolToMarketSymbol(pool.base, pool.quote);
  const marketPk = new PublicKey(SOLANA_CONFIG.markets[marketSymbol]);

  const client = createOpenBookClient(owner);
  const market = await Market.load(client, marketPk);

  const baseMint = market.account.baseMint;
  const quoteMint = market.account.quoteMint;
  const userBaseAccount = getAssociatedTokenAddressSync(baseMint, owner);
  const userQuoteAccount = getAssociatedTokenAddressSync(quoteMint, owner);

  const priceLots = new BN(0);
  const maxBaseLots = market.baseUiToLots(parseFloat(quantity));
  const orderType = PlaceOrderTypeUtils.Market;

  const args = {
    side: toOpenBookSide(side),
    priceLots,
    maxBaseLots,
    maxQuoteLotsIncludingFees: I64_MAX_BN,
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
  ixs.push(placeIx);

  return ixs;
}

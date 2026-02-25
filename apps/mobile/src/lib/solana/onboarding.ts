/**
 * OpenBook onboarding: ensure OpenOrdersIndexer and OpenOrdersAccount exist.
 */
import { TransactionInstruction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import {
  createOpenBookClient,
  poolToMarketSymbol,
  Market,
} from './openbook-client';
import { SOLANA_CONFIG } from '../../config/solana';
import type { Pool } from './types';

export interface OnboardingResult {
  openOrdersAccount: PublicKey;
  needsCreate: boolean;
  instructions: TransactionInstruction[];
}

/**
 * Check if OpenOrdersIndexer and OpenOrdersAccount exist for the market.
 * Returns instructions needed to create them if missing.
 */
export async function ensureOpenOrdersForMarket(
  owner: PublicKey,
  pool: Pool
): Promise<OnboardingResult> {
  const marketSymbol = poolToMarketSymbol(pool.base, pool.quote);
  const marketPk = new PublicKey(SOLANA_CONFIG.markets[marketSymbol]);

  const client = createOpenBookClient(owner);

  const existingOoPks = await client.findOpenOrdersForMarket(owner, marketPk);
  if (existingOoPks && existingOoPks.length > 0) {
    return {
      openOrdersAccount: existingOoPks[0],
      needsCreate: false,
      instructions: [],
    };
  }

  const [createOoIxs, openOrdersPk] = await client.createOpenOrdersIx(
    marketPk,
    'default',
    owner,
    null,
    undefined
  );

  return {
    openOrdersAccount: openOrdersPk,
    needsCreate: true,
    instructions: createOoIxs,
  };
}

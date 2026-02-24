import { PublicKey } from '@solana/web3.js';
import { SOLANA_CONFIG } from '../../config/solana';

const PROGRAM_ID = new PublicKey(SOLANA_CONFIG.programId);

/**
 * Derive OpenOrdersIndexer PDA for an owner.
 * Seeds: ["OpenOrdersIndexer", owner]
 */
export function getOpenOrdersIndexerPda(owner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('OpenOrdersIndexer'), owner.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Derive OpenOrdersAccount PDA for owner at given index.
 * Seeds: ["OpenOrders", owner, accountIndex (u32 LE)]
 */
export function getOpenOrdersAccountPda(
  owner: PublicKey,
  accountIndex: number
): PublicKey {
  const indexBuffer = Buffer.alloc(4);
  indexBuffer.writeUInt32LE(accountIndex, 0);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('OpenOrders'), owner.toBuffer(), indexBuffer],
    PROGRAM_ID
  );
  return pda;
}

/**
 * Get market public key from symbol
 */
export function getMarketPk(marketSymbol: string): PublicKey {
  const addr = SOLANA_CONFIG.markets[marketSymbol];
  if (!addr) throw new Error(`Unknown market: ${marketSymbol}`);
  return new PublicKey(addr);
}

/**
 * Get token mint public key from symbol
 */
export function getTokenMintPk(tokenSymbol: string): PublicKey {
  const addr = SOLANA_CONFIG.tokens[tokenSymbol];
  if (!addr) throw new Error(`Unknown token: ${tokenSymbol}`);
  return new PublicKey(addr);
}

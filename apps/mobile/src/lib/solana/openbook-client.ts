/**
 * OpenBook v2 client for building instructions.
 * Uses @openbook-dex/openbook-v2 with custom program ID.
 * Transactions are sent via Privy (not through this client).
 */
import { Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { OpenBookV2Client, Market } from '@openbook-dex/openbook-v2';
import { getSolanaConnection } from './connection';
import { SOLANA_CONFIG } from '../../config/solana';
import { getOpenOrdersIndexerPda, getOpenOrdersAccountPda, getMarketPk } from './pdas';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const PROGRAM_ID = new PublicKey(SOLANA_CONFIG.programId);

/**
 * Create a dummy wallet for instruction building only.
 * We never use signTransaction - Privy handles signing.
 */
function createDummyWallet(publicKey: PublicKey) {
  return {
    publicKey,
    signTransaction: async () => {
      throw new Error('Use Privy provider to sign transactions');
    },
  };
}

/**
 * Create OpenBook client for instruction building.
 * Pass the user's public key for fee payer / signer in instructions.
 */
export function createOpenBookClient(userPublicKey: PublicKey): OpenBookV2Client {
  const connection = getSolanaConnection();
  const wallet = createDummyWallet(userPublicKey);
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: 'confirmed',
  });
  return new OpenBookV2Client(provider, PROGRAM_ID);
}

/**
 * Get pool (base, quote mint addresses) from market symbol e.g. "BTC_USDT" or "BTC/USDT"
 */
export function marketSymbolToPool(
  symbol: string,
  baseAsset?: string,
  quoteAsset?: string
): { base: string; quote: string } {
  const baseSym = baseAsset ?? symbol.split(/[_/]/)[0];
  const quoteSym = quoteAsset ?? symbol.split(/[_/]/)[1];
  if (!baseSym || !quoteSym) throw new Error(`Invalid market symbol: ${symbol}`);
  const base = SOLANA_CONFIG.tokens[baseSym];
  const quote = SOLANA_CONFIG.tokens[quoteSym];
  if (!base || !quote) throw new Error(`Unknown tokens: ${baseSym}/${quoteSym}. Available: ${Object.keys(SOLANA_CONFIG.tokens).join(', ')}`);
  return { base, quote };
}

/**
 * Resolve market symbol from base/quote token addresses (Pool format)
 */
export function poolToMarketSymbol(base: string, quote: string): string {
  const baseUpper = Object.entries(SOLANA_CONFIG.tokens).find(
    ([_, addr]) => addr === base
  )?.[0];
  const quoteUpper = Object.entries(SOLANA_CONFIG.tokens).find(
    ([_, addr]) => addr === quote
  )?.[0];
  if (!baseUpper || !quoteUpper) {
    throw new Error(`Unknown token pair: ${base}/${quote}`);
  }
  const symbol = `${baseUpper}_${quoteUpper}`;
  if (!SOLANA_CONFIG.markets[symbol]) {
    throw new Error(`No market for ${symbol}`);
  }
  return symbol;
}

export { Market, getOpenOrdersIndexerPda, getOpenOrdersAccountPda, getMarketPk };

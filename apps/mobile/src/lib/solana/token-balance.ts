/**
 * Fetch SPL token balance for a wallet.
 */
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { getSolanaConnection } from './connection';

export interface TokenBalanceResult {
  raw: bigint;
  formatted: string;
  decimals: number;
  symbol: string;
}

/**
 * Get SPL token balance for owner's associated token account.
 * Returns zero balance if account doesn't exist.
 */
export async function getTokenBalance(
  mint: PublicKey,
  owner: PublicKey,
  symbol: string
): Promise<TokenBalanceResult> {
  const connection = getSolanaConnection();
  const ata = getAssociatedTokenAddressSync(mint, owner);

  try {
    const { value } = await connection.getTokenAccountBalance(ata);
    const raw = BigInt(value.amount);
    const decimals = value.decimals;
    const formatted = (Number(raw) / Math.pow(10, decimals)).toString();
    return { raw, formatted, decimals, symbol };
  } catch {
    // Account doesn't exist - balance is 0
    return {
      raw: 0n,
      formatted: '0',
      decimals: 6,
      symbol,
    };
  }
}

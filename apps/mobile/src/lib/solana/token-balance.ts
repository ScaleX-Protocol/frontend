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
    console.log('--- FETCHING BALANCE ---');
    console.log('symbol:', symbol);
    console.log('mint:', mint.toBase58());
    console.log('wallet:', owner.toBase58());

    // Instead of looking for a specific ATA, we scan ALL Token Accounts 
    // owned by the wallet for this specific mint.
    // This fixes devnet issues where faucets deposit to non-ATA addresses.
    const response = await connection.getParsedTokenAccountsByOwner(owner, {
      mint: mint,
    });

    if (response.value.length === 0) {
      console.log('No token accounts found for this mint. Returning 0 balance.');
      return {
        raw: 0n,
        formatted: '0',
        decimals: 6,
        symbol,
      };
    }

    // Usually response.value[0] is the primary/ATA account, but we can aggregate them
    // or just take the first one since it holds the balance.
    let totalRaw = 0n;
    let decimals = 6; // default fallback

    for (const tokenAccountInfo of response.value) {
      const parsedData = tokenAccountInfo.account.data.parsed.info.tokenAmount;
      totalRaw += BigInt(parsedData.amount);
      decimals = parsedData.decimals; // Use true decimals from the token account
    }

    console.log('Total token balance (raw):', totalRaw.toString());
    const formatted = (Number(totalRaw) / Math.pow(10, decimals)).toString();
    
    return { raw: totalRaw, formatted, decimals, symbol };
  } catch (error) {
    console.error('Error in getTokenAccountBalance:', error);
    // Account doesn't exist - balance is 0
    return {
      raw: 0n,
      formatted: '0',
      decimals: 6,
      symbol,
    };
  }
}

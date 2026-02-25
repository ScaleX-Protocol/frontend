/**
 * Build deposit instructions.
 * User deposits underlying token → receives synthetic/trading balance.
 */
import type { TransactionInstruction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { SOLANA_CONFIG } from '../../config/solana';
import { getTokenMintPk } from './pdas';

export interface BuildDepositIxsParams {
  tokenSymbol: string;
  amount: string;
  owner: PublicKey;
  decimals?: number;
}

/**
 * Build instructions to deposit tokens into the vault.
 * Creates user ATA if needed, then transfers to vault ATA.
 */
export async function buildDepositIxs(
  params: BuildDepositIxsParams
): Promise<TransactionInstruction[]> {
  const { tokenSymbol, amount, owner, decimals = 6 } = params;

  const vaultAddress = SOLANA_CONFIG.depositVaultAddress;
  if (!vaultAddress) {
    throw new Error(
      'Deposit vault not configured. Set EXPO_PUBLIC_DEPOSIT_VAULT or depositVaultAddress in solana config.'
    );
  }

  const mint = getTokenMintPk(tokenSymbol);
  const mintPk = new PublicKey(mint);
  const vaultPk = new PublicKey(vaultAddress);

  const userAta = getAssociatedTokenAddressSync(mintPk, owner);
  const vaultAta = getAssociatedTokenAddressSync(mintPk, vaultPk);

  const amountRaw = BigInt(
    Math.floor(parseFloat(amount) * Math.pow(10, decimals))
  );
  if (amountRaw <= 0n) {
    throw new Error('Deposit amount must be greater than 0');
  }

  const instructions: TransactionInstruction[] = [];

  // Ensure user has ATA
  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userAta,
      owner,
      mintPk
    )
  );

  // Ensure vault has ATA
  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      owner, // payer for creation
      vaultAta,
      vaultPk,
      mintPk
    )
  );

  // Transfer from user to vault
  instructions.push(
    createTransferInstruction(userAta, vaultAta, owner, amountRaw)
  );

  return instructions;
}

/**
 * Build Solana lending instructions (withdrawCollateral, borrow, repay).
 * Uses OpenBook v2 + Lending program (same programId as place order).
 */
import { TransactionInstruction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { SOLANA_CONFIG } from '../../config/solana';
import { getTokenMintPk } from './pdas';
import {
  findLendingPoolAddress,
  findPoolVaultAddress,
  findUserCollateralAddress,
} from './pdas';

const PROGRAM_ID = new PublicKey(SOLANA_CONFIG.programId);

// Anchor instruction discriminators (sha256("global:<name>")[0..8])
const DISCRIMINATOR = {
  withdrawCollateral: Buffer.from('7387a86a8bd68a96', 'hex'),
  borrow: Buffer.from('e4fd83cacf745912', 'hex'),
  repay: Buffer.from('ea674352d0eadba6', 'hex'),
} as const;

function amountToBuffer(amount: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(amount);
  return buf;
}

export type LendingTokenSymbol = 'USDT' | 'BTC' | 'WETH';

export interface WithdrawCollateralParams {
  tokenSymbol: LendingTokenSymbol;
  amount: string;
  owner: PublicKey;
  decimals?: number;
}

export interface BorrowParams {
  tokenSymbol: LendingTokenSymbol;
  amount: string;
  owner: PublicKey;
  decimals?: number;
}

export interface RepayParams {
  tokenSymbol: LendingTokenSymbol;
  amount: string;
  owner: PublicKey;
  decimals?: number;
}

/**
 * Build withdrawCollateral instruction.
 * Withdraw previously deposited collateral from lending pool.
 */
export async function buildWithdrawCollateralIxs(
  params: WithdrawCollateralParams
): Promise<TransactionInstruction[]> {
  const { tokenSymbol, amount, owner, decimals = 6 } = params;
  const amountRaw = BigInt(
    Math.floor(parseFloat(amount) * Math.pow(10, decimals))
  );
  if (amountRaw <= 0n) throw new Error('Amount must be > 0');

  const assetMint = new PublicKey(getTokenMintPk(tokenSymbol));
  const oracleAddr = SOLANA_CONFIG.oracles[tokenSymbol];
  if (!oracleAddr) throw new Error(`Oracle not configured for ${tokenSymbol}`);

  const [lendingPool] = findLendingPoolAddress(assetMint, PROGRAM_ID);
  const [poolVault] = findPoolVaultAddress(assetMint, PROGRAM_ID);
  const [userCollateral] = findUserCollateralAddress(owner, PROGRAM_ID);
  const userTokenAccount = getAssociatedTokenAddressSync(assetMint, owner);
  const oracle = new PublicKey(oracleAddr);

  const instructions: TransactionInstruction[] = [];

  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenAccount,
      owner,
      assetMint
    )
  );

  const data = Buffer.concat([
    DISCRIMINATOR.withdrawCollateral,
    amountToBuffer(amountRaw),
  ]);

  instructions.push(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: assetMint, isSigner: false, isWritable: false },
        { pubkey: lendingPool, isSigner: false, isWritable: true },
        { pubkey: poolVault, isSigner: false, isWritable: true },
        { pubkey: userCollateral, isSigner: false, isWritable: true },
        { pubkey: oracle, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data,
    })
  );

  return instructions;
}

/**
 * Build borrow instruction.
 * Borrow tokens from lending pool against deposited collateral.
 */
export async function buildBorrowIxs(
  params: BorrowParams
): Promise<TransactionInstruction[]> {
  const { tokenSymbol, amount, owner, decimals = 6 } = params;
  const amountRaw = BigInt(
    Math.floor(parseFloat(amount) * Math.pow(10, decimals))
  );
  if (amountRaw <= 0n) throw new Error('Amount must be > 0');

  const assetMint = new PublicKey(getTokenMintPk(tokenSymbol));
  const oracleAddr = SOLANA_CONFIG.oracles[tokenSymbol];
  if (!oracleAddr) throw new Error(`Oracle not configured for ${tokenSymbol}`);

  const [lendingPool] = findLendingPoolAddress(assetMint, PROGRAM_ID);
  const [poolVault] = findPoolVaultAddress(assetMint, PROGRAM_ID);
  const [userCollateral] = findUserCollateralAddress(owner, PROGRAM_ID);
  const userTokenAccount = getAssociatedTokenAddressSync(assetMint, owner);
  const borrowOracle = new PublicKey(oracleAddr);

  const instructions: TransactionInstruction[] = [];

  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenAccount,
      owner,
      assetMint
    )
  );

  const data = Buffer.concat([
    DISCRIMINATOR.borrow,
    amountToBuffer(amountRaw),
  ]);

  instructions.push(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: assetMint, isSigner: false, isWritable: false },
        { pubkey: lendingPool, isSigner: false, isWritable: true },
        { pubkey: poolVault, isSigner: false, isWritable: true },
        { pubkey: userCollateral, isSigner: false, isWritable: true },
        { pubkey: borrowOracle, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data,
    })
  );

  return instructions;
}

/**
 * Build repay instruction.
 * Repay borrowed tokens to lending pool.
 */
export async function buildRepayIxs(
  params: RepayParams
): Promise<TransactionInstruction[]> {
  const { tokenSymbol, amount, owner, decimals = 6 } = params;
  const amountRaw = BigInt(
    Math.floor(parseFloat(amount) * Math.pow(10, decimals))
  );
  if (amountRaw <= 0n) throw new Error('Amount must be > 0');

  const assetMint = new PublicKey(getTokenMintPk(tokenSymbol));

  const [lendingPool] = findLendingPoolAddress(assetMint, PROGRAM_ID);
  const [poolVault] = findPoolVaultAddress(assetMint, PROGRAM_ID);
  const [userCollateral] = findUserCollateralAddress(owner, PROGRAM_ID);
  const userTokenAccount = getAssociatedTokenAddressSync(assetMint, owner);

  const instructions: TransactionInstruction[] = [];

  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenAccount,
      owner,
      assetMint
    )
  );

  const data = Buffer.concat([DISCRIMINATOR.repay, amountToBuffer(amountRaw)]);

  instructions.push(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: assetMint, isSigner: false, isWritable: false },
        { pubkey: lendingPool, isSigner: false, isWritable: true },
        { pubkey: poolVault, isSigner: false, isWritable: true },
        { pubkey: userCollateral, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: false, isWritable: false }, // borrower (same as repayer when self-repay)
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data,
    })
  );

  return instructions;
}

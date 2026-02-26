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
  depositCollateral: Buffer.from('9c838e7492f7a278', 'hex'), // global:deposit_collateral
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

export interface DepositCollateralParams {
  tokenSymbol: LendingTokenSymbol;
  amount: string;
  owner: PublicKey;
  decimals?: number;
}

/**
 * Build depositCollateral instruction.
 * Deposit tokens as collateral into the lending protocol.
 */
export async function buildDepositCollateralIxs(
  params: DepositCollateralParams
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
  
  // We cannot blindly use ATA because on Devnet, faucets often send to a legacy token account. 
  // We must find the exact token account that actually holds the funds.
  let sourceTokenAccount = getAssociatedTokenAddressSync(assetMint, owner);
  let needsAtaCreation = true;

  try {
    const { getSolanaConnection } = await import('./connection');
    const connection = getSolanaConnection();
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint: assetMint });
    
    if (tokenAccounts.value.length > 0) {
      // Find an account with enough balance, or just use the largest one
      const fundedAccount = tokenAccounts.value.find(acc => 
        BigInt(acc.account.data.parsed.info.tokenAmount.amount) >= amountRaw
      );
      
      if (fundedAccount) {
        sourceTokenAccount = new PublicKey(fundedAccount.pubkey);
        // If the funded account is NOT the ATA, we don't need to (and can't) "create" it as an ATA
        if (!sourceTokenAccount.equals(getAssociatedTokenAddressSync(assetMint, owner))) {
          needsAtaCreation = false;
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch token accounts, falling back to strict ATA', e);
  }

  const instructions: TransactionInstruction[] = [];

  // 1. Ensure user has ATA constructed (only if we're using the standard ATA)
  if (needsAtaCreation) {
    instructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        owner,
        sourceTokenAccount,
        owner,
        assetMint
      )
    );
  }

  // 2. Add the smart contract instruction
  const data = Buffer.concat([
    DISCRIMINATOR.depositCollateral,
    amountToBuffer(amountRaw),
  ]);

  instructions.push(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: sourceTokenAccount, isSigner: false, isWritable: true },
        { pubkey: assetMint, isSigner: false, isWritable: false },
        { pubkey: lendingPool, isSigner: false, isWritable: true },
        { pubkey: poolVault, isSigner: false, isWritable: true },
        { pubkey: userCollateral, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: PublicKey.default, isSigner: false, isWritable: false }, // System program fallback handled by web3.js generally, but we provide SystemProgram.programId if needed
      ],
      data,
    })
  );

  return instructions;
}

export interface WithdrawCollateralParams {
  tokenSymbol: LendingTokenSymbol;
  amount: string;
  owner: PublicKey;
  decimals?: number;
}

export interface BorrowParams {
  tokenSymbol: string;
  amount: string;
  owner: PublicKey;
  decimals?: number;
  collateralMints?: string[]; // Mints of all deposited collateral
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
  const { tokenSymbol, amount, owner, decimals = 6, collateralMints = [] } = params;
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

  // Build main accounts
  const accounts = [
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: userTokenAccount, isSigner: false, isWritable: true },
    { pubkey: assetMint, isSigner: false, isWritable: false },
    { pubkey: lendingPool, isSigner: false, isWritable: true },
    { pubkey: poolVault, isSigner: false, isWritable: true },
    { pubkey: userCollateral, isSigner: false, isWritable: true },
    { pubkey: borrowOracle, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  // Add oracle accounts for all deposited collateral as remaining accounts
  // This is needed so the program can calculate total collateral value
  for (const mintAddr of collateralMints) {
    try {
      // Find token symbol for this mint
      let tokenSymbol: LendingTokenSymbol | null = null;
      for (const [symbol, configuredMint] of Object.entries(SOLANA_CONFIG.tokens)) {
        if (configuredMint === mintAddr) {
          tokenSymbol = symbol as LendingTokenSymbol;
          break;
        }
      }

      if (!tokenSymbol) continue;

      const collateralOracleAddr = SOLANA_CONFIG.oracles[tokenSymbol];
      if (!collateralOracleAddr) continue;

      const collateralOracle = new PublicKey(collateralOracleAddr);

      // Add lending pool and oracle for each collateral type
      const [collateralPool] = findLendingPoolAddress(new PublicKey(mintAddr), PROGRAM_ID);

      accounts.push(
        { pubkey: collateralPool, isSigner: false, isWritable: false },
        { pubkey: collateralOracle, isSigner: false, isWritable: false }
      );
    } catch (e) {
      console.warn(`Could not add collateral oracle for mint ${mintAddr}:`, e);
    }
  }

  instructions.push(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: accounts,
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

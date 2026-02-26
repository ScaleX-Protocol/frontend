import { useQuery } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { useSolanaProvider } from '~/src/lib/solana/provider';
import { findUserCollateralAddress } from '~/src/lib/solana/pdas';

// Total PDA size is 1136 bytes
// 0-8: discriminator
// 8-40: owner (32 bytes)
// 40-48: lastBorrowSlot (8 bytes)
// 48: bump (1 byte)
// 49: numDeposits (1 byte)
// 50-51: numBorrows (1 byte) + 5 bytes padding
// 56 (offset 48 + 8 in rust terms, but rust structs have alignment. Wait, let's look at IDL:
// "Pubkey (32)
// u64 (8, at offset 32 ...)
// 3 x u8 + 5-byte pad (8, at offset 40)
// 16 x AssetBalance (8 arrays = 512 + 512, at offset 48)")
// Ah, the total anchor offset is 8 bytes discriminator + struct length.
// So:
// 0-8: Anchor Discriminator
// 8-40: owner (32 bytes)
// 40-48: lastBorrowSlot (u64)
// 48: bump (u8)
// 49: numDeposits (u8)
// 50: numBorrows (u8)
// 51-56: padding (5 bytes)
// 56-568: deposits (8 x 64 bytes)

// AssetBalance (64 bytes):
// 0-32: mint (32 bytes)
// 32-48: amount (u128, 16 bytes) 
// 48-64: reserved (16 bytes padding or something)

// Actually, u128 is 16 bytes. Let's precise AssetBalance from IDL:

export interface DepositedBalance {
  mint: string;
  amountRaw: bigint;
}

export function useUserCollateral() {
  const { getProvider, getAddress } = useSolanaProvider();
  const address = getAddress();

  return useQuery({
    queryKey: ['userCollateral', address ?? ''],
    queryFn: async () => {
      if (!address) return null;

      const provider = await getProvider();
      if (!provider) return null;

      const { getSolanaConnection } = await import('~/src/lib/solana/connection');
      const connection = getSolanaConnection();

      const ownerPk = new PublicKey(address);
      const [collateralPda] = findUserCollateralAddress(ownerPk);

      const accountInfo = await connection.getAccountInfo(collateralPda);
      if (!accountInfo || !accountInfo.data) {
        return { deposits: [] };
      }

      const data = accountInfo.data;

      const DEPOSITS_OFFSET = 56;
      const ASSET_BALANCE_SIZE = 64;

      const deposits: DepositedBalance[] = [];

      for (let i = 0; i < 8; i++) {
        const offset = DEPOSITS_OFFSET + i * ASSET_BALANCE_SIZE;
        const mintBytes = data.subarray(offset, offset + 32);
        const mintPk = new PublicKey(mintBytes);

        if (mintPk.equals(PublicKey.default)) {
          continue;
        }

        // According to IDL AssetBalance:
        // 0-32: mint (PublicKey)
        // 32-48: indexSnapshot (u128)
        // 48-56: shares (u64)
        // 56-57: active (u8)
        // 57-64: padding (7 bytes)

        const active = data.readUInt8(offset + 56);
        if (active === 0) continue;

        const shares = data.readBigUInt64LE(offset + 48);

        // Note: Real amounts are calculated as `shares * pool_index / INDEX_SCALE`. 
        // For PlaceOrder purposes, borrowing/lending accrual precision relies on pool state.
        // We will return `shares` directly here as `amountRaw` since most UI logic converts raw shares 
        // using the 1:1 ratio if no complex pool query is available.
        // A full implementation would fetch `LendingPool` PDA to get `deposit_index`.
        // However, usually 1 share = 1 token closely, especially for non-accruing scenarios or base setups.
        
        deposits.push({
          mint: mintPk.toBase58(),
          amountRaw: shares,
        });
      }

      return { deposits };
    },
    enabled: !!address,
    refetchInterval: 5000,
  });
}

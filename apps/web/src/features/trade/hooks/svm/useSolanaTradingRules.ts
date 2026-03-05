'use client';

import { useQuery } from '@tanstack/react-query';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useSolana } from '@/providers/SolanaProvider';
import { createOpenbookProgram, type AnchorWallet } from '@/lib/anchor/program';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { Market } from '../../types/chart.types';

export interface SolanaTradingRules {
  minTradeAmount: bigint;
  minAmountMovement: bigint;
  minPriceMovement: bigint;
  minOrderSize: bigint;
}

interface UseSolanaTradingRulesParams {
  baseMint: string;
  quoteMint: string;
}

// Dummy wallet for read-only Anchor queries (no signing needed)
const READ_ONLY_WALLET: AnchorWallet = {
  publicKey: PublicKey.default,
  signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T) => tx,
  signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]) => txs,
};

export function useSolanaTradingRules({ baseMint, quoteMint }: UseSolanaTradingRulesParams) {
  const { connection } = useSolana();

  const { data, isLoading, error } = useQuery({
    queryKey: ['solana-trading-rules', baseMint, quoteMint],
    queryFn: async () => {
      // 1. Get all markets from indexer to obtain poolId (market address) list
      const markets = await fetchIndexerAPI<Market[]>('/markets');

      // 2. For each market, fetch the on-chain account and find the one
      //    whose baseMint/quoteMint match the requested pair
      const { program } = createOpenbookProgram(connection, READ_ONLY_WALLET);

      for (const market of markets) {
        const marketPubkey = new PublicKey(market.poolId);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const marketAccount: any = await (program.account as any)['market'].fetch(marketPubkey);
          if (
            marketAccount.baseMint.toBase58() === baseMint &&
            marketAccount.quoteMint.toBase58() === quoteMint
          ) {
            const baseLotSize = BigInt(marketAccount.baseLotSize.toString());
            const quoteLotSize = BigInt(marketAccount.quoteLotSize.toString());
            return {
              tradingRules: {
                minTradeAmount: baseLotSize,
                minAmountMovement: baseLotSize,
                minPriceMovement: quoteLotSize,
                minOrderSize: baseLotSize,
              } satisfies SolanaTradingRules,
              orderBookAddress: market.poolId,
              poolKey: marketPubkey,
            };
          }
        } catch {
          // Market fetch failed — skip and try the next
        }
      }

      throw new Error(`No Solana market found for baseMint=${baseMint} quoteMint=${quoteMint}`);
    },
    enabled: !!baseMint && !!quoteMint,
    staleTime: 5 * 60 * 1000, // Market lot sizes rarely change — cache for 5 min
    retry: 2,
  });

  return {
    tradingRules: data?.tradingRules,
    orderBookAddress: data?.orderBookAddress,
    poolKey: data?.poolKey,
    isLoading,
    error,
  };
}

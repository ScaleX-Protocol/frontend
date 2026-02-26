import { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { useSolanaProvider } from '~/src/lib/solana/provider';
import { createOpenBookClient, Market } from '~/src/lib/solana/openbook-client';
import { BN } from '@coral-xyz/anchor';

export function useOpenBookMarket(marketAddress: string | undefined | null) {
  const { getAddress } = useSolanaProvider();

  const client = useMemo(() => {
    const address = getAddress();
    if (!address) return null;
    return createOpenBookClient(new PublicKey(address));
  }, [getAddress]);

  const { data: marketAcc, isLoading } = useQuery({
    queryKey: ['openbookMarket', marketAddress],
    queryFn: async () => {
      if (!client || !marketAddress) return null;
      const marketPk = new PublicKey(marketAddress);
      const market = await Market.load(client, marketPk);
      return market;
    },
    enabled: !!client && !!marketAddress,
  });

  const uiToLots = (
    uiBaseAmount: number,
    uiPrice: number,
    baseDecimals: number,
    quoteDecimals: number
  ) => {
    if (!marketAcc) {
      throw new Error("Market data not ready");
    }

    const baseLotSize = marketAcc.account.baseLotSize;
    const quoteLotSize = marketAcc.account.quoteLotSize;

    // Kalkulasi maxBaseLots
    const nativeBase = new BN(Math.round(uiBaseAmount * Math.pow(10, baseDecimals)));
    const maxBaseLots = nativeBase.div(baseLotSize);

    // Kalkulasi priceLots
    const quoteAtomsPerUiBase = new BN(Math.round(uiPrice * Math.pow(10, quoteDecimals)));
    const baseDecimalsMultiplier = new BN(10).pow(new BN(baseDecimals));

    const priceLotsNumerator = quoteAtomsPerUiBase.mul(baseLotSize);
    const priceLotsDenominator = quoteLotSize.mul(baseDecimalsMultiplier);
    
    const priceLots = priceLotsNumerator.div(priceLotsDenominator);

    return {
      maxBaseLots,
      priceLots,
      baseLotSize,
      quoteLotSize
    };
  };

  return {
    marketAcc,
    isLoading,
    uiToLots,
  };
}

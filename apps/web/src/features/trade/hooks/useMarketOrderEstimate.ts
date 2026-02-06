import { useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ScaleXRouterABI } from '@/configs/contracts';
import { SCALEX_ROUTER_ADDRESS } from '@/configs/addresses';

interface UseMarketOrderEstimateParams {
  pool: {
    base: `0x${string}`;
    quote: `0x${string}`;
    spacing: number;
    fee: number;
  };
  inputAmount: string;
  side: 0 | 1; // 0 = BUY, 1 = SELL
  inputDecimals: number;
  outputDecimals: number;
  enabled: boolean;
}

export function useMarketOrderEstimate({
  pool,
  inputAmount,
  side,
  inputDecimals,
  outputDecimals,
  enabled,
}: UseMarketOrderEstimateParams) {
  const slippageToleranceBps = 100; // 1% default slippage

  const { data, isLoading, error } = useReadContract({
    address: SCALEX_ROUTER_ADDRESS as `0x${string}`,
    abi: ScaleXRouterABI,
    functionName: 'calculateMinOutAmountForMarket',
    args: [
      pool,
      parseUnits(inputAmount || '0', inputDecimals),
      side,
      BigInt(slippageToleranceBps),
    ],
    query: {
      enabled: enabled && !!inputAmount && parseFloat(inputAmount) > 0,
      refetchInterval: 5000, // Refetch every 5s for fresh estimates
    },
  });

  const estimatedOutput = data
    ? formatUnits(data, outputDecimals)
    : '0';

  return {
    estimatedOutput,
    isLoading,
    error,
  };
}

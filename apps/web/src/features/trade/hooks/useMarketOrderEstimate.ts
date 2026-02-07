import { useReadContract, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ScaleXRouterABI, Contracts } from '@/configs/contracts';
import { logger } from '@/utils/prodLogger';

const log = logger.withContext({ component: 'useMarketOrderEstimate' });

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
  const chainId = useChainId();
  const slippageToleranceBps = 100; // 1% default slippage

  // Get router address for current chain
  const routerAddress = Contracts[chainId as keyof typeof Contracts]?.scaleXRouterAddress;

  // Log if router address is missing
  if (!routerAddress && enabled) {
    log.warn('ScaleX Router address not found for chain', { chainId });
  }

  const { data, isLoading, error } = useReadContract({
    address: routerAddress as `0x${string}`,
    abi: ScaleXRouterABI,
    functionName: 'calculateMinOutAmountForMarket',
    args: [
      pool,
      parseUnits(inputAmount || '0', inputDecimals),
      side,
      BigInt(slippageToleranceBps),
    ],
    query: {
      enabled: enabled && !!inputAmount && parseFloat(inputAmount) > 0 && !!routerAddress,
      refetchInterval: 5000, // Refetch every 5s for fresh estimates
    },
  });

  // Debug logging
  if (error) {
    log.error('Market order estimate contract call failed', {
      error,
      pool,
      inputAmount,
      side: side === 0 ? 'BUY' : 'SELL',
      chainId
    });
  }
  if (data !== undefined) {
    log.debug('Market order estimate received', {
      input: inputAmount,
      output: formatUnits(data, outputDecimals),
      side: side === 0 ? 'BUY' : 'SELL',
      pool,
    });
  }

  const estimatedOutput = data
    ? formatUnits(data, outputDecimals)
    : '0';

  return {
    estimatedOutput,
    isLoading,
    error,
  };
}

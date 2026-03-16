'use client';

import { AlertCircle, Loader2, Info, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { usePrivyPlaceOrder, OrderSide, OrderStep, Pool } from '@/features/trade/hooks/order/usePrivyPlaceOrder';
import { useHealthFactorProjection } from '@/features/trade/hooks/useHealthFactorProjection';
import { useMarketOrderEstimate } from '@/features/trade/hooks/useMarketOrderEstimate';
import HealthFactorDisplay from '@/features/trade/components/placeOrder/shared/HealthFactorDisplay';
import { getBlockExplorerTxUrl } from '@/configs/chain';
import { logger } from '@/utils/prodLogger';
import { Tooltip } from '@/components/ui/tooltip';
import { useReadContract } from 'wagmi';
import { Contracts, PoolManagerABI } from '@/configs/contracts';
import { ChainConfig } from '@/configs/chain';

interface MarketOrderProps {
  buySell: 'buy' | 'sell';
  baseBalance: string;
  quoteBalance: string;
  isLoadingBalance: boolean;
  baseToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  quoteToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  onBalanceRefresh?: () => void;
  onDataRefresh?: () => void;
  variant?: 'desktop' | 'mobile';
}

const log = logger.withContext({ component: 'MarketOrder' });

export default function MarketOrder({
  buySell,
  baseBalance,
  quoteBalance,
  isLoadingBalance,
  baseToken,
  quoteToken,
  onBalanceRefresh,
  onDataRefresh,
  variant = 'desktop'
}: MarketOrderProps) {
  const [marketSize, setMarketSize] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  // Note: timeInForce is not used for market orders - the smart contract automatically uses IOC (Immediate or Cancel)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [autoRepay, setAutoRepay] = useState(false);
  const [autoBorrow, setAutoBorrow] = useState(false);

  const { placeMarketOrder, isPending, isConfirming, isAuthenticated, error, currentStep } = usePrivyPlaceOrder({
    onSuccess: (hash, orderId) => {
      log.info('Market order placed successfully', { hash, orderId, symbol: `${baseToken.symbol}/${quoteToken.symbol}` });
      setTransactionHash(hash);
      setMarketSize('');
      setSliderValue(0);
      setIsSubmitting(false);
      // Refresh balance data
      if (onBalanceRefresh) {
        onBalanceRefresh();
      }
      // Refresh all trade data (orders, chart, etc.)
      if (onDataRefresh) {
        onDataRefresh();
      }
      setTimeout(() => setTransactionHash(null), 10000);
    },
    onError: (error) => {
      log.error('Market order failed', { error: error.message, symbol: `${baseToken.symbol}/${quoteToken.symbol}` });
      setIsSubmitting(false);
    },
  });

  // Determine token to borrow (quote for BUY, base for SELL)
  const borrowToken = useMemo(() => {
    return buySell === 'buy' ? quoteToken : baseToken;
  }, [buySell, quoteToken, baseToken]);

  const poolManagerAddress = Contracts[ChainConfig.defaultChainId].poolManagerAddress;

  const poolKey = {
    'currency0': (baseToken?.address || '0x0') as `0x${string}`,
    'currency1': (quoteToken?.address || '0x0') as `0x${string}`,
  };

  // Get the Pool (which includes orderBook address)
  const { data: _pool } = useReadContract({
    address: poolManagerAddress,
    abi: PoolManagerABI,
    functionName: 'getPool',
    args: poolKey ? [poolKey] : undefined,
    query: {
      enabled: !!poolKey,
    },
  });

  // Calculate estimated output for market orders
  const { estimatedOutput, isLoading: isLoadingEstimate, error: estimateError } = useMarketOrderEstimate({
    pool: {
      baseCurrency: (baseToken?.address || '0x0') as `0x${string}`,
      quoteCurrency: (quoteToken?.address || '0x0') as `0x${string}`,
      orderBook: (_pool as any)?.orderBook || '0x0',
    },
    inputAmount: marketSize,
    side: buySell === 'buy' ? 0 : 1,
    inputDecimals: buySell === 'buy' ? (quoteToken?.decimals || 18) : (baseToken?.decimals || 18),
    outputDecimals: buySell === 'buy' ? (baseToken?.decimals || 18) : (quoteToken?.decimals || 18),
    enabled: !!marketSize && parseFloat(marketSize) > 0 && !!baseToken && !!quoteToken,
  });

  // Debug logging for market order estimate
  if (estimateError) {
    log.error('Market order estimate error', {
      error: estimateError,
      marketSize,
      side: buySell,
      baseToken: baseToken.address,
      quoteToken: quoteToken.address
    });
  }
  if (estimatedOutput && parseFloat(estimatedOutput) > 0) {
    log.debug('Market order estimate', {
      input: marketSize,
      output: estimatedOutput,
      side: buySell
    });
  }

  // Calculate market price from estimated output
  const marketPrice = useMemo(() => {
    if (!estimatedOutput || !marketSize || parseFloat(estimatedOutput) === 0 || parseFloat(marketSize) === 0) {
      return null;
    }

    const input = parseFloat(marketSize);
    const output = parseFloat(estimatedOutput);

    // Price is always quoted as quote token per base token
    // For SELL: selling base for quote, so price = output / input
    // For BUY: buying base with quote, so price = input / output
    const price = buySell === 'sell'
      ? output / input  // output is quote, input is base
      : input / output; // input is quote, output is base

    return price.toFixed(price < 1 ? 6 : 0).replace(/\.?0+$/, '');
  }, [estimatedOutput, marketSize, buySell]);

  // Calculate borrow amount needed (if any)
  const borrowAmountNeeded = useMemo(() => {
    if (!autoBorrow || !marketSize) return '0';

    const amount = parseFloat(marketSize);
    const balance = buySell === 'buy'
      ? parseFloat(quoteBalance.replace(/,/g, ''))
      : parseFloat(baseBalance.replace(/,/g, ''));

    // Borrow amount = amount - balance (if positive)
    const needToBorrow = Math.max(0, amount - balance);
    return needToBorrow.toString();
  }, [autoBorrow, marketSize, buySell, quoteBalance, baseBalance]);

  // Calculate estimated price for borrowed token (for HF calculation)
  const estimatedBorrowPrice = useMemo(() => {
    if (!estimatedOutput || !marketSize) return undefined;

    const input = parseFloat(marketSize);
    const output = parseFloat(estimatedOutput);

    if (input > 0 && output > 0) {
      // For SELL: selling base for quote, so price = output / input (quote per base)
      // For BUY: buying base with quote, so price = input / output (quote per base)
      return buySell === 'sell'
        ? (output / input).toString()  // quote token per base token
        : (input / output).toString(); // quote token per base token
    }

    return undefined;
  }, [estimatedOutput, marketSize, buySell]);

  // Health factor projection hook
  const healthFactorProjection = useHealthFactorProjection({
    enabled: autoBorrow, // Show health factor whenever auto-borrow is enabled
    tokenAddress: borrowToken.address as `0x${string}`,
    borrowAmount: borrowAmountNeeded,
    tokenDecimals: borrowToken.decimals,
    orderType: 'market',
    estimatedPrice: estimatedBorrowPrice, // Pass estimated price for accurate USD valuation
  });

  // Dynamic slider color based on health factor
  const sliderColor = useMemo(() => {
    if (!autoBorrow) return variant === 'mobile' ? '#E26B1D' : '#F06718';

    const { status } = healthFactorProjection;
    if (status === 'safe') return '#2ECC71';  // Green
    if (status === 'warning') return '#FFA500';  // Yellow
    return '#FF6B6B';  // Red (danger)
  }, [autoBorrow, healthFactorProjection, variant]);

  // Calculate maximum available amount (balance + max safe borrow if auto-borrow enabled)
  const maxAvailableAmount = useMemo(() => {
    const balance = buySell === 'buy'
      ? parseFloat(quoteBalance.replace(/,/g, ''))
      : parseFloat(baseBalance.replace(/,/g, ''));

    if (autoBorrow && healthFactorProjection.maxSafeBorrowAmount) {
      const maxBorrow = parseFloat(healthFactorProjection.maxSafeBorrowAmount);
      return balance + maxBorrow;
    }

    return balance;
  }, [buySell, quoteBalance, baseBalance, autoBorrow, healthFactorProjection.maxSafeBorrowAmount]);

  // Validate that required token information is provided
  if (!baseToken || !baseToken.symbol || baseToken.decimals === undefined) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[200px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#F06718] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">Missing Base Token Info</h3>
          <p className="text-sm text-[#E0E0E0]/70">Base token information is required to place market orders.</p>
        </div>
      </div>
    );
  }
  if (!quoteToken || !quoteToken.symbol || quoteToken.decimals === undefined) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[200px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#F06718] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">Missing Quote Token Info</h3>
          <p className="text-sm text-[#E0E0E0]/70">Quote token information is required to place market orders.</p>
        </div>
      </div>
    );
  }

  const pool: Pool = {
    base: baseToken.address,
    quote: quoteToken.address,
    spacing: 1,
    fee: 3000
  };

  // Handle slider change
  const handleSliderChange = (percentage: number) => {
    setSliderValue(percentage);
    const amount = (maxAvailableAmount * percentage / 100);
    const formattedAmount = amount.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
    setMarketSize(formattedAmount);
  };

  const handleMarketOrder = async () => {
    if (!isAuthenticated || !marketSize || parseFloat(marketSize) <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const side = buySell === 'buy' ? OrderSide.BUY : OrderSide.SELL;

      await placeMarketOrder({
        pool,
        quantity: marketSize,
        side,
        depositAmount: '0',
        quantityDecimals: side === OrderSide.BUY ? quoteToken.decimals : baseToken.decimals,
        depositDecimals: side === OrderSide.BUY ? quoteToken.decimals : baseToken.decimals,
        autoRepay,
        autoBorrow
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  // Mobile variant UI
  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-4">
        {/* Market Price Input - Mobile Style */}
        <div className="bg-[#111111] rounded-[12px] flex flex-col gap-0.5 p-3 py-2.5 border border-[#222222]">
          <div className="flex items-center justify-between">
            <span className="text-[#666666] text-[10px] leading-[15px]">Price</span>
            <span className="text-[#666666] text-[10px] leading-[15px]">{quoteToken.symbol}</span>
          </div>
          {isLoadingEstimate ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#666666]" />
              <span className="text-[16px] leading-[24px] font-medium text-[#555555]">Loading...</span>
            </div>
          ) : marketPrice ? (
            <span className="text-[16px] leading-[24px] font-medium text-white">
              {marketPrice}
            </span>
          ) : (
            <span className="text-[16px] leading-[24px] font-medium text-[#555555]">Market Price</span>
          )}
        </div>

        {/* Amount Input - Mobile Style with label inside */}
        <div className="bg-[#111111] rounded-[12px] flex flex-col gap-0.5 p-3 py-2.5 border border-[#222222]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#666666] text-[10px] leading-[15px]">Amount</span>
            <span className="text-[#666666] text-[10px] leading-[15px]">
              {buySell === 'buy' ? quoteToken.symbol : baseToken.symbol}
            </span>
          </div>
          <input
            type="text"
            value={marketSize}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setMarketSize(value);
                if (maxAvailableAmount > 0) {
                  const percentage = (parseFloat(value || '0') / maxAvailableAmount) * 100;
                  setSliderValue(Math.min(100, percentage));
                }
              }
            }}
            placeholder="0.00"
            disabled={isPending || isConfirming || !isAuthenticated}
            className="bg-transparent text-[16px] leading-[24px] font-medium text-white placeholder:text-[#555555] outline-none w-full disabled:opacity-50"
          />
        </div>

        {/* Percentage Slider - Mobile Style */}
        <div className="flex flex-col gap-4">
          <style>
            {`
              .mobile-slider-${buySell}::-webkit-slider-thumb {
                background-color: ${sliderColor};
              }
              .mobile-slider-${buySell}::-moz-range-thumb {
                background-color: ${sliderColor};
              }
            `}
          </style>
          <div className="relative h-6 flex items-center">
            <div className="absolute w-full h-[3px] bg-[#333333] top-1/2 -translate-y-1/2 rounded-full pointer-events-none" />
            <div
              className="absolute h-[3px] border top-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-colors duration-300"
              style={{
                width: `${sliderValue}%`,
                backgroundColor: sliderColor,
                borderColor: sliderColor
              }}
            />
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              disabled={isPending || isConfirming || !isAuthenticated || isLoadingBalance}
              className={`mobile-slider-${buySell} relative w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:duration-300
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:duration-300`}
              style={{ background: 'transparent', height: '4px' }}
            />
          </div>
          <div className="flex justify-between text-[10px] leading-[15px] text-[#555555]">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Health Factor Display - Mobile */}
        {autoBorrow && (
          <HealthFactorDisplay
            healthFactor={healthFactorProjection}
            variant="mobile"
          />
        )}

        {/* Health Factor Warning - Mobile */}
        {autoBorrow && healthFactorProjection.status === 'warning' && (
          <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/20">
            <div className="flex items-start gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Health Factor Warning</span>
                <span className="text-xs text-yellow-300/80">
                  This order will reduce your health factor to {healthFactorProjection.projected.toFixed(2)}. Consider reducing the amount for safety.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Health Factor Danger - Mobile */}
        {autoBorrow && healthFactorProjection.status === 'danger' && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20">
            <div className="flex items-start gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Liquidation Risk</span>
                <span className="text-xs text-red-300/80">
                  Warning: This order may risk liquidation (HF: {healthFactorProjection.projected.toFixed(2)}).
                  {healthFactorProjection.maxSafeBorrowAmount && parseFloat(healthFactorProjection.maxSafeBorrowAmount) > 0 && (
                    <> Maximum safe amount: {parseFloat(healthFactorProjection.maxSafeBorrowAmount).toFixed(4)} {borrowToken.symbol}</>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Auto Borrow & Auto Repay Checkboxes */}
        <div className="flex flex-col gap-3 py-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={autoBorrow}
                onChange={(e) => setAutoBorrow(e.target.checked)}
                disabled={isPending || isConfirming || !isAuthenticated}
                className="peer w-5 h-5 rounded border border-[#4A4A4A] bg-[#1A1A1A] appearance-none cursor-pointer disabled:opacity-50 checked:bg-[#F06718] checked:border-[#F06718] transition-colors"
              />
              <svg
                className="absolute w-3 h-3 pointer-events-none hidden peer-checked:block text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#E0E0E0] text-sm font-medium">Auto Borrow</span>
              <Tooltip content="Borrow if insufficient balance">
                <Info className="w-4 h-4 text-[#6A6A6A] hover:text-[#A0A0A0] transition-colors" />
              </Tooltip>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={autoRepay}
                onChange={(e) => setAutoRepay(e.target.checked)}
                disabled={isPending || isConfirming || !isAuthenticated}
                className="peer w-5 h-5 rounded border border-[#4A4A4A] bg-[#1A1A1A] appearance-none cursor-pointer disabled:opacity-50 checked:bg-[#F06718] checked:border-[#F06718] transition-colors"
              />
              <svg
                className="absolute w-3 h-3 pointer-events-none hidden peer-checked:block text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#E0E0E0] text-sm font-medium">Auto Repay</span>
              <Tooltip content="Repay debt when order fills">
                <Info className="w-4 h-4 text-[#6A6A6A] hover:text-[#A0A0A0] transition-colors" />
              </Tooltip>
            </div>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error.message}</span>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {isConfirming && (
          <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Waiting for confirmation...</span>
            </div>
          </div>
        )}

        {/* Syncing Status */}
        {currentStep === OrderStep.SYNCING && (
          <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Syncing with indexer...</span>
            </div>
          </div>
        )}

        {/* Transaction Success */}
        {transactionHash && (
          <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/20">
            <div className="flex flex-col gap-1 text-green-400">
              <span className="text-sm font-medium">✓ Transaction Successful!</span>
              <a
                href={getBlockExplorerTxUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-300 hover:text-green-200 underline break-all"
              >
                {transactionHash}
              </a>
            </div>
          </div>
        )}

        {/* Submit Button - Mobile Style */}
        <button
          type="button"
          onClick={handleMarketOrder}
          disabled={
            !isAuthenticated ||
            !marketSize ||
            parseFloat(marketSize) <= 0 ||
            isPending ||
            isConfirming ||
            isSubmitting ||
            currentStep === OrderStep.SYNCING
          }
          // className="w-full py-4 rounded-full text-sm leading-[20px] font-semibold transition-all text-white bg-[#E26B1D] hover:bg-[#F07830] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(232,106,37,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
          className="w-full btn-primary flex-1 justify-center"
        >
          <span className="flex items-center justify-center gap-2">
            {(isPending || isSubmitting || currentStep === OrderStep.SYNCING) && <Loader2 className="w-5 h-5 animate-spin" />}
            {currentStep === OrderStep.SYNCING ? (
              'Syncing...'
            ) : isPending || isSubmitting ? (
              buySell === 'buy' ? 'Placing Buy Order...' : 'Placing Sell Order...'
            ) : !isAuthenticated ? (
              'Log In to Trade'
            ) : !marketSize || parseFloat(marketSize) <= 0 ? (
              `${buySell === 'buy' ? 'Buy' : 'Sell'} ${baseToken.symbol}`
            ) : (
              `${buySell === 'buy' ? 'Buy' : 'Sell'} ${baseToken.symbol}`
            )}
          </span>
        </button>
      </div>
    );
  }

  // Desktop variant UI (original)
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-4">
        {/* Market Price Input */}
        <div className='flex flex-col w-full'>
          <span className='text-[#555555] text-[10px] font-semibold leading-[15px] mb-[7px]'>PRICE</span>
          <div className="bg-[#050505] rounded-[8px] px-4 py-3 border border-[#222222]">
            <div className="flex items-center justify-between">
              {isLoadingEstimate ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#666666]" />
                  <span className="text-sm leading-[20px] text-[#555555]">Loading...</span>
                </div>
              ) : marketPrice ? (
                <span className="text-sm leading-[20px] text-[#FFFFFF]">
                  {marketPrice}
                </span>
              ) : (
                <span className="text-sm leading-[20px] text-[#555555]">Market Price</span>
              )}
              <span className="text-[#555555] text-[10px] font-medium leading-[15px]">{quoteToken.symbol}</span>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className='flex flex-col w-full'>
          <span className='text-[#555555] text-[10px] font-semibold leading-[15px] mb-[7px]'>AMOUNT</span>
          <div className="bg-[#050505] rounded-[8px] px-4 py-3 border border-[#222222]">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={marketSize}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setMarketSize(value);
                    // Update slider based on input
                    if (maxAvailableAmount > 0) {
                      const percentage = (parseFloat(value || '0') / maxAvailableAmount) * 100;
                      setSliderValue(Math.min(100, percentage));
                    }
                  }
                }}
                placeholder="0"
                disabled={isPending || isConfirming || !isAuthenticated}
                className="bg-transparent text-sm leading-[20px] text-[#FFFFFF] outline-none w-28 disabled:opacity-50"
              />
              <span className="text-[#555555] text-[10px] font-medium leading-[15px]">
                {buySell === 'buy' ? quoteToken.symbol : baseToken.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Percentage Slider */}
        <div className="flex flex-col gap-2">
          <style>
            {`
              .desktop-slider-${buySell}::-webkit-slider-thumb {
                background-color: ${sliderColor};
              }
              .desktop-slider-${buySell}::-moz-range-thumb {
                background-color: ${sliderColor};
              }
            `}
          </style>
          <div className="relative h-6 flex items-center">
            <div className="absolute w-full h-[2px] bg-[#4A4A4A] top-1/2 -translate-y-1/2 rounded-full pointer-events-none" />
            <div
              className="absolute h-[2px] top-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-colors duration-300"
              style={{
                width: `${sliderValue}%`,
                backgroundColor: sliderColor
              }}
            />
            <div className="absolute w-full flex justify-between px-[2px] top-1/2 -translate-y-1/2 pointer-events-none z-1">
              {[0, 25, 50, 75, 100].map((step) => (
                <div
                  key={step}
                  className="w-2.5 h-2.5 rounded-full border-2 transition-colors duration-300"
                  style={{
                    backgroundColor: sliderValue >= step ? sliderColor : '#4A4A4A',
                    borderColor: sliderValue >= step ? sliderColor : '#2A2A2A'
                  }}
                />
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              disabled={isPending || isConfirming || !isAuthenticated || isLoadingBalance}
              className={`desktop-slider-${buySell} relative w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:duration-300
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:duration-300`}
              style={{ background: 'transparent', height: '4px' }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#E0E0E0]/70">
            <span>0</span>
            <span>100%</span>
          </div>
        </div>

        {/* Health Factor Display - Desktop */}
        {autoBorrow && (
          <HealthFactorDisplay
            healthFactor={healthFactorProjection}
            variant="desktop"
          />
        )}

        {/* Health Factor Warning - Desktop */}
        {autoBorrow && healthFactorProjection.status === 'warning' && (
          <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/20">
            <div className="flex items-start gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Health Factor Warning</span>
                <span className="text-xs text-yellow-300/80">
                  This order will reduce your health factor to {healthFactorProjection.projected.toFixed(2)}. Consider reducing the amount for safety.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Health Factor Danger - Desktop */}
        {autoBorrow && healthFactorProjection.status === 'danger' && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20">
            <div className="flex items-start gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Liquidation Risk</span>
                <span className="text-xs text-red-300/80">
                  Warning: This order may risk liquidation (HF: {healthFactorProjection.projected.toFixed(2)}).
                  {healthFactorProjection.maxSafeBorrowAmount && parseFloat(healthFactorProjection.maxSafeBorrowAmount) > 0 && (
                    <> Maximum safe amount: {parseFloat(healthFactorProjection.maxSafeBorrowAmount).toFixed(4)} {borrowToken.symbol}</>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bg-[#111111] rounded-[8px] px-4 py-3 border border-[#222222]">
          <div className="flex items-center justify-between">
            <span className="text-[#666666] text-xs leading-[16px]">Total</span>
            <div className="flex items-center gap-2">
              {isLoadingEstimate ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#666666]" />
              ) : (
                <span className='text-[#FFFFFF] text-sm leading-[20px]'>
                  {estimatedOutput && parseFloat(estimatedOutput) > 0
                    ? `~${parseFloat(estimatedOutput).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                    : '0.00'
                  }
                </span>
              )}
              <span className="text-[#555555] text-[10px] leading-[20px]">
                {buySell === 'buy' ? baseToken.symbol : quoteToken.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Auto Borrow & Auto Repay Checkboxes */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={autoBorrow}
                onChange={(e) => setAutoBorrow(e.target.checked)}
                disabled={isPending || isConfirming || !isAuthenticated}
                className="peer w-4 h-4 rounded border border-[#4A4A4A] bg-[#1A1A1A] appearance-none cursor-pointer disabled:opacity-50 checked:bg-[#F06718] checked:border-[#F06718] transition-colors"
              />
              <svg
                className="absolute w-2.5 h-2.5 pointer-events-none hidden peer-checked:block text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="text-[#E0E0E0]">Auto Borrow</span>
            <Tooltip content="Borrow if insufficient balance">
              <Info className="w-3.5 h-3.5 text-[#6A6A6A] hover:text-[#A0A0A0] transition-colors" />
            </Tooltip>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={autoRepay}
                onChange={(e) => setAutoRepay(e.target.checked)}
                disabled={isPending || isConfirming || !isAuthenticated}
                className="peer w-4 h-4 rounded border border-[#4A4A4A] bg-[#1A1A1A] appearance-none cursor-pointer disabled:opacity-50 checked:bg-[#F06718] checked:border-[#F06718] transition-colors"
              />
              <svg
                className="absolute w-2.5 h-2.5 pointer-events-none hidden peer-checked:block text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="text-[#E0E0E0]">Auto Repay</span>
            <Tooltip content="Repay debt when order fills">
              <Info className="w-3.5 h-3.5 text-[#6A6A6A] hover:text-[#A0A0A0] transition-colors" />
            </Tooltip>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-2 rounded-lg bg-red-900/20 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error.message}</span>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {isConfirming && (
          <div className="p-2 rounded-lg bg-yellow-900/20 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Waiting for confirmation...</span>
            </div>
          </div>
        )}

        {/* Syncing Status */}
        {currentStep === OrderStep.SYNCING && (
          <div className="p-2 rounded-lg bg-blue-900/20 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Syncing with indexer...</span>
            </div>
          </div>
        )}

        {/* Transaction Success */}
        {transactionHash && (
          <div className="p-2 rounded-lg bg-green-900/20 border border-green-500/20">
            <div className="flex flex-col gap-1 text-green-400">
              <span className="text-sm font-medium">✓ Transaction Successful!</span>
              <a
                href={getBlockExplorerTxUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-300 hover:text-green-200 underline break-all"
              >
                {transactionHash}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button - 3D Glossy Effect */}
      <button
        type="button"
        onClick={handleMarketOrder}
        disabled={
          !isAuthenticated ||
          !marketSize ||
          parseFloat(marketSize) <= 0 ||
          isPending ||
          isConfirming ||
          isSubmitting ||
          currentStep === OrderStep.SYNCING
        }
        // className="relative w-full mt-5 py-[10px] rounded-full text-sm leading-[20px] font-medium transition-all text-white bg-[#E86A25] hover:bg-[#F07830] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_3px_6px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/20 before:to-transparent before:rounded-t-full"
        className="w-full btn-primary flex-1 justify-center mt-5"
      >
        <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2">
          {(isPending || isSubmitting || currentStep === OrderStep.SYNCING) && <Loader2 className="w-5 h-5 animate-spin" />}
          {currentStep === OrderStep.SYNCING ? (
            'Syncing...'
          ) : isPending || isSubmitting ? (
            buySell === 'buy' ? 'Placing Buy Order...' : 'Placing Sell Order...'
          ) : !isAuthenticated ? (
            'Log In to Trade'
          ) : !marketSize || parseFloat(marketSize) <= 0 ? (
            'Enter Amount'
          ) : (
            buySell === 'buy' ? 'Buy' : 'Sell'
          )}
        </span>
      </button>
    </div>
  );
}

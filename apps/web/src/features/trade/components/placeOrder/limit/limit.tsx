'use client';

import { getBlockExplorerTxUrl } from '@/configs/chain';
import { useTickerPrice } from '@/features/trade/hooks/chart/useTickerPrice';
import { OrderSide, OrderStep, Pool, TimeInForce, usePrivyPlaceOrder } from '@/features/trade/hooks/order/usePrivyPlaceOrder';
import { useHealthFactorProjection } from '@/features/trade/hooks/useHealthFactorProjection';
import HealthFactorDisplay from '@/features/trade/components/placeOrder/shared/HealthFactorDisplay';
import { logger } from '@/utils/prodLogger';
import { AlertCircle, ChevronDown, Loader2, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { ToggleSwitch } from '@/components/ui/toggle-switch';

interface LimitOrderProps {
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
  initialPrice?: string;
  variant?: 'desktop' | 'mobile';
}

const log = logger.withContext({ component: '[Limit Issue] LimitOrder' });

export default function LimitOrder({
  buySell,
  baseBalance,
  quoteBalance,
  isLoadingBalance,
  baseToken,
  quoteToken,
  onBalanceRefresh,
  onDataRefresh,
  initialPrice,
  variant = 'desktop'
}: LimitOrderProps) {
 
  const [limitPrice, setLimitPrice] = useState('');
  const [limitSize, setLimitSize] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [timeInForce, setTimeInForce] = useState<TimeInForce>(TimeInForce.GTC);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [autoRepay, setAutoRepay] = useState(false);
  const [autoBorrow, setAutoBorrow] = useState(false);

  // Fetch current market price to set as default
  const symbol = `${baseToken.symbol}/${quoteToken.symbol}`;
  const { data: tickerPrice } = useTickerPrice(symbol);

  // Track previous symbol to detect market changes
  const [prevSymbol, setPrevSymbol] = useState(symbol);

  // Reset price when market (symbol) changes
  useEffect(() => {
    if (symbol !== prevSymbol) {
      setLimitPrice('');
      setPrevSymbol(symbol);
    }
  }, [symbol, prevSymbol]);

  // Set default price when ticker price is available
  useEffect(() => {
    if (tickerPrice?.price && !limitPrice) {
      const rawPrice = parseFloat(tickerPrice.price);
      const formattedPrice = rawPrice / Math.pow(10, quoteToken.decimals);
      // Use toFixed to avoid scientific notation, then remove trailing zeros
      const formatted = formattedPrice.toFixed(formattedPrice < 1 ? 8 : 2).replace(/\.?0+$/, '');
      setLimitPrice(formatted);
    }
  }, [tickerPrice?.price, limitPrice, quoteToken.decimals]);

  // Update price when initialPrice prop changes (from order book click)
  useEffect(() => {
    if (initialPrice && initialPrice !== limitPrice) {
      setLimitPrice(initialPrice);
    }
  }, [initialPrice, limitPrice]);

  const { placeLimitOrder, isPending, isConfirming, isAuthenticated, error, currentStep } = usePrivyPlaceOrder({
    onSuccess: (hash, orderId) => {
      log.info('Limit order placed successfully', { hash, orderId, symbol, price: limitPrice, quantity: limitSize });
      setTransactionHash(hash);
      setLimitPrice('');
      setLimitSize('');
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
      log.error('Limit order failed', { error: error.message, symbol, price: limitPrice, quantity: limitSize });
      setIsSubmitting(false);
    },
  });

  // Determine token to borrow (quote for BUY, base for SELL) - must be before early returns
  const borrowToken = useMemo(() => {
    return buySell === 'buy' ? quoteToken : baseToken;
  }, [buySell, quoteToken, baseToken]);

  // Calculate borrow amount needed (if any) - more complex for limit orders
  const borrowAmountNeeded = useMemo(() => {
    if (!autoBorrow || !limitSize || !limitPrice) return '0';

    const size = parseFloat(limitSize);

    if (buySell === 'buy') {
      // For BUY: Need quote token (price * size - quoteBalance)
      const quoteNeeded = size * parseFloat(limitPrice);
      const quoteBalance_num = parseFloat(quoteBalance.replace(/,/g, ''));
      const needToBorrow = Math.max(0, quoteNeeded - quoteBalance_num);
      return needToBorrow.toString();
    } else {
      // For SELL: Need base token (size - baseBalance)
      const baseBalance_num = parseFloat(baseBalance.replace(/,/g, ''));
      const needToBorrow = Math.max(0, size - baseBalance_num);
      return needToBorrow.toString();
    }
  }, [autoBorrow, limitSize, limitPrice, buySell, quoteBalance, baseBalance]);

  // Health factor projection hook
  const healthFactorProjection = useHealthFactorProjection({
    enabled: autoBorrow, // Show health factor whenever auto-borrow is enabled
    tokenAddress: borrowToken.address as `0x${string}`,
    borrowAmount: borrowAmountNeeded,
    tokenDecimals: borrowToken.decimals,
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
    if (buySell === 'buy') {
      const quoteBalance_num = parseFloat(quoteBalance.replace(/,/g, ''));

      if (autoBorrow && healthFactorProjection.maxSafeBorrowAmount) {
        const maxBorrow = parseFloat(healthFactorProjection.maxSafeBorrowAmount);
        return quoteBalance_num + maxBorrow;
      }

      return quoteBalance_num;
    } else {
      const baseBalance_num = parseFloat(baseBalance.replace(/,/g, ''));

      if (autoBorrow && healthFactorProjection.maxSafeBorrowAmount) {
        const maxBorrow = parseFloat(healthFactorProjection.maxSafeBorrowAmount);
        return baseBalance_num + maxBorrow;
      }

      return baseBalance_num;
    }
  }, [buySell, quoteBalance, baseBalance, autoBorrow, healthFactorProjection.maxSafeBorrowAmount]);

  // Validate that required token information is provided
  if (!baseToken || !baseToken.symbol || !baseToken.decimals) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[200px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#F06718] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">Missing Base Token Info</h3>
          <p className="text-sm text-[#E0E0E0]/70">Base token information is required to place limit orders.</p>
        </div>
      </div>
    );
  }
  if (!quoteToken || !quoteToken.symbol || !quoteToken.decimals) {
    return (
      <div className="flex items-center justify-center p-6 min-h-[200px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#F06718] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">Missing Quote Token Info</h3>
          <p className="text-sm text-[#E0E0E0]/70">Quote token information is required to place limit orders.</p>
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

    if (buySell === 'buy') {
      // For BUY: Calculate how much base token we can buy with the available quote
      const quoteToSpend = (maxAvailableAmount * percentage / 100);

      // Convert quote amount to base amount using current price
      if (limitPrice && parseFloat(limitPrice) > 0) {
        const baseAmount = quoteToSpend / parseFloat(limitPrice);
        const formattedAmount = baseAmount.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
        setLimitSize(formattedAmount);
      } else {
        setLimitSize('');
      }
    } else {
      // For SELL: Use available base directly
      const amount = (maxAvailableAmount * percentage / 100);
      const formattedAmount = amount.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
      setLimitSize(formattedAmount);
    }
  };

  const handleLimitOrder = async () => {
    if (!isAuthenticated || !limitPrice || parseFloat(limitPrice) <= 0 || !limitSize || parseFloat(limitSize) <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const side = buySell === 'buy' ? OrderSide.BUY : OrderSide.SELL;
      // limitSize already represents the base token amount for both BUY and SELL
      const actualQuantity = limitSize;

      await placeLimitOrder({
        pool,
        price: limitPrice,
        quantity: actualQuantity,
        side,
        timeInForce,
        depositAmount: '0',
        quantityDecimals: baseToken.decimals,
        depositDecimals: side === OrderSide.BUY ? quoteToken.decimals : baseToken.decimals,
        priceDecimals: quoteToken.decimals,
        autoRepay,
        autoBorrow
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  const timeInForceOptions = [
    { value: TimeInForce.GTC, label: "Good 'Till Canceled" },
    { value: TimeInForce.IOC, label: "Immediate Or Cancel" },
    { value: TimeInForce.FOK, label: "Fill Or Kill" },
    { value: TimeInForce.PO, label: "Post Only" },
  ];

  // Mobile variant UI
  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-4">
        {/* Price Input - Mobile Style with label inside */}
        <div className="bg-[#111111] rounded-[12px] flex flex-col gap-0.5 p-3 py-2.5 border border-[#222222]">
          <div className="flex items-center justify-between">
            <span className="text-[#666666] text-[10px] leading-[15px]">Price</span>
            <span className="text-[#666666] text-[10px] leading-[15px]">{quoteToken.symbol}</span>
          </div>
          <input
            type="text"
            value={limitPrice}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setLimitPrice(value);
              }
            }}
            placeholder="0.00"
            disabled={isPending || isConfirming || !isAuthenticated}
            className="bg-transparent text-[16px] leading-[24px] font-medium text-white outline-none w-full disabled:opacity-50"
          />
        </div>

        {/* Amount Input - Mobile Style with label inside */}
        <div className="bg-[#111111] rounded-[12px] flex flex-col gap-0.5 p-3 py-2.5 border border-[#222222]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#666666] text-[10px] leading-[15px]">Amount</span>
            <span className="text-[#666666] text-[10px] leading-[15px]">{baseToken.symbol}</span>
          </div>
          <input
            type="text"
            value={limitSize}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setLimitSize(value);
                // Update slider based on input
                if (buySell === 'buy') {
                  // For BUY: Convert base amount to quote amount using price
                  if (maxAvailableAmount > 0 && limitPrice && parseFloat(limitPrice) > 0) {
                    const quoteAmount = parseFloat(value || '0') * parseFloat(limitPrice);
                    const percentage = (quoteAmount / maxAvailableAmount) * 100;
                    setSliderValue(Math.min(100, percentage));
                  }
                } else {
                  // For SELL: Use base amount directly
                  if (maxAvailableAmount > 0) {
                    const percentage = (parseFloat(value || '0') / maxAvailableAmount) * 100;
                    setSliderValue(Math.min(100, percentage));
                  }
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
              .mobile-limit-slider-${buySell}::-webkit-slider-thumb {
                background-color: ${sliderColor};
              }
              .mobile-limit-slider-${buySell}::-moz-range-thumb {
                background-color: ${sliderColor};
              }
            `}
          </style>
          <div className="relative h-6 flex items-center">
            {/* Track background */}
            <div className="absolute w-full h-[3px] bg-[#333333] top-1/2 -translate-y-1/2 rounded-full pointer-events-none" />
            {/* Active track */}
            <div
              className="absolute h-[3px] border top-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-colors duration-300"
              style={{
                width: `${sliderValue}%`,
                backgroundColor: sliderColor,
                borderColor: sliderColor
              }}
            />
            {/* Slider input */}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              disabled={isPending || isConfirming || !isAuthenticated || isLoadingBalance}
              className={`mobile-limit-slider-${buySell} relative w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:duration-300
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:duration-300`}
              style={{ background: 'transparent', height: '4px' }}
            />
          </div>
          {/* Percentage labels */}
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
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
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

        {/* Good 'till canceled Toggle */}
        <div className="flex items-center justify-between py-2">
          <span className="text-white text-sm leading-[20px]">Good &apos;till canceled</span>
          <ToggleSwitch
            checked={timeInForce === TimeInForce.GTC}
            onChange={(checked) => setTimeInForce(checked ? TimeInForce.GTC : TimeInForce.IOC)}
            disabled={isPending || isConfirming || !isAuthenticated}
          />
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
          onClick={handleLimitOrder}
          disabled={
            !isAuthenticated ||
            !limitPrice ||
            parseFloat(limitPrice) <= 0 ||
            !limitSize ||
            parseFloat(limitSize) <= 0 ||
            isPending ||
            isConfirming ||
            isSubmitting ||
            currentStep === OrderStep.SYNCING
          }
          className="w-full py-4 rounded-[16px] text-sm leading-[20px] font-semibold transition-all text-white bg-[#E26B1D] hover:bg-[#F07830] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(232,106,37,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            {(isPending || isSubmitting || currentStep === OrderStep.SYNCING) && <Loader2 className="w-5 h-5 animate-spin" />}
            {currentStep === OrderStep.SYNCING ? (
              'Syncing...'
            ) : isPending || isSubmitting ? (
              buySell === 'buy' ? 'Placing Buy Order...' : 'Placing Sell Order...'
            ) : !isAuthenticated ? (
              'Log In to Trade'
            ) : !limitPrice || parseFloat(limitPrice) <= 0 || !limitSize || parseFloat(limitSize) <= 0 ? (
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
        {/* Price Input */}
        <div className='flex flex-col w-full'>
          <span className='text-[#555555] text-[10px] font-semibold leading-[15px] mb-[7px]'>PRICE</span>
          <div className="bg-[#050505] rounded-[8px] px-4 py-3 border border-[#222222]">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={limitPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setLimitPrice(value);
                  }
                }}
                placeholder="0"
                disabled={isPending || isConfirming || !isAuthenticated}
                className="bg-transparent text-sm leading-[20px] text-[#FFFFFF] outline-none w-28 disabled:opacity-50"
              />
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
                value={limitSize}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setLimitSize(value);
                    // Update slider based on input
                    if (buySell === 'buy') {
                      // For BUY: Convert base amount to quote amount using price
                      if (maxAvailableAmount > 0 && limitPrice && parseFloat(limitPrice) > 0) {
                        const quoteAmount = parseFloat(value || '0') * parseFloat(limitPrice);
                        const percentage = (quoteAmount / maxAvailableAmount) * 100;
                        setSliderValue(Math.min(100, percentage));
                      }
                    } else {
                      // For SELL: Use base amount directly
                      if (maxAvailableAmount > 0) {
                        const percentage = (parseFloat(value || '0') / maxAvailableAmount) * 100;
                        setSliderValue(Math.min(100, percentage));
                      }
                    }
                  }
                }}
                placeholder="0"
                disabled={isPending || isConfirming || !isAuthenticated}
                className="bg-transparent text-sm leading-[20px] text-[#FFFFFF] outline-none w-28 disabled:opacity-50"
              />
              <span className="text-[#555555] text-[10px] font-medium leading-[15px]">{baseToken.symbol}</span>
            </div>
          </div>
        </div>

        {/* Percentage Slider */}
        <div className="flex flex-col gap-2">
          <style>
            {`
              .desktop-limit-slider-${buySell}::-webkit-slider-thumb {
                background-color: ${sliderColor};
              }
              .desktop-limit-slider-${buySell}::-moz-range-thumb {
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
              className={`desktop-limit-slider-${buySell} relative w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed z-10
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
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
              <span className='text-[#FFFFFF] text-sm leading-[20px]'>
                {limitPrice && limitSize
                  ? (parseFloat(limitPrice) * parseFloat(limitSize)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0.00'
                }
              </span>
              <span className="text-[#555555] text-[10px] leading-[20px]">{quoteToken.symbol}</span>
            </div>
          </div>
        </div>

        {/* Time in Force */}
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280] text-sm">Time in Force</span>
          <div className="relative">
            <select
              value={timeInForce}
              onChange={(e) => setTimeInForce(Number(e.target.value) as TimeInForce)}
              disabled={isPending || isConfirming || !isAuthenticated}
              className="px-3 py-2 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg text-[#E0E0E0] text-sm focus:outline-none focus:border-[#F06718] disabled:opacity-50 appearance-none cursor-pointer pr-8"
            >
              {timeInForceOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-[#6B7280]" />
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
        onClick={handleLimitOrder}
        disabled={
          !isAuthenticated ||
          !limitPrice ||
          parseFloat(limitPrice) <= 0 ||
          !limitSize ||
          parseFloat(limitSize) <= 0 ||
          isPending ||
          isConfirming ||
          isSubmitting ||
          currentStep === OrderStep.SYNCING
        }
        // className="relative w-full mt-5 py-[14px] rounded-[12px] text-sm leading-[20px] font-medium transition-all text-[#000000] bg-[#FFFFFF]"
        className="relative w-full mt-5 py-[10px] rounded-full text-sm leading-[20px] font-medium transition-all text-white bg-[#E86A25] hover:bg-[#F07830] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_3px_6px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/20 before:to-transparent before:rounded-t-full"
      >
        <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2">
          {(isPending || isSubmitting || currentStep === OrderStep.SYNCING) && <Loader2 className="w-5 h-5 animate-spin" />}
          {currentStep === OrderStep.SYNCING ? (
            'Syncing...'
          ) : isPending || isSubmitting ? (
            buySell === 'buy' ? 'Placing Buy Order...' : 'Placing Sell Order...'
          ) : !isAuthenticated ? (
            'Log In to Trade'
          ) : !limitPrice || parseFloat(limitPrice) <= 0 || !limitSize || parseFloat(limitSize) <= 0 ? (
            'Enter Price and Amount'
          ) : (
            buySell === 'buy' ? 'Buy' : 'Sell'
          )}
        </span>
      </button>
    </div>
  );
}

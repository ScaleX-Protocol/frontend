'use client';

import { getBlockExplorerTxUrl } from '@/configs/chain';
import { useTickerPrice } from '@/features/trade/hooks/chart/useTickerPrice';
import { OrderSide, Pool, TimeInForce, usePrivyPlaceOrder } from '@/features/trade/hooks/order/usePrivyPlaceOrder';
import { logger } from '@/utils/prodLogger';
import { AlertCircle, ChevronDown, Loader2, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Tooltip } from '@/components/ui/tooltip';

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
}

const log = logger.withContext({ component: '[Limit Issue] LimitOrder' });

export default function LimitOrder({
  buySell,
  baseBalance,
  quoteBalance,
  isLoadingBalance,
  baseToken,
  quoteToken,
  onBalanceRefresh
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

  // Set default price when ticker price is available
  useEffect(() => {
    if (tickerPrice?.price && !limitPrice) {
      const rawPrice = parseFloat(tickerPrice.price);
      const formattedPrice = rawPrice / Math.pow(10, quoteToken.decimals);
      setLimitPrice(formattedPrice.toString());
    }
  }, [tickerPrice?.price, limitPrice, quoteToken.decimals]);

  const { placeLimitOrder, isPending, isConfirming, isAuthenticated, error } = usePrivyPlaceOrder({
    onSuccess: (hash, orderId) => {
      log.info('Limit order placed successfully', { hash, orderId, symbol, price: limitPrice, quantity: limitSize });
      setTransactionHash(hash);
      setLimitPrice('');
      setLimitSize('');
      setSliderValue(0);
      setIsSubmitting(false);
      if (onBalanceRefresh) {
        onBalanceRefresh();
      }
      setTimeout(() => setTransactionHash(null), 10000);
    },
    onError: (error) => {
      log.error('Limit order failed', { error: error.message, symbol, price: limitPrice, quantity: limitSize });
      setIsSubmitting(false);
    },
  });

  // Validate that required token information is provided
  if (!baseToken || !baseToken.address || !baseToken.symbol || !baseToken.decimals) {
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
  if (!quoteToken || !quoteToken.address || !quoteToken.symbol || !quoteToken.decimals) {
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
    const availableBalance = buySell === 'buy'
      ? parseFloat(quoteBalance.replace(/,/g, ''))
      : parseFloat(baseBalance.replace(/,/g, ''));
    const amount = (availableBalance * percentage / 100);
    const formattedAmount = amount.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
    setLimitSize(formattedAmount);
  };

  const handleLimitOrder = async () => {
    if (!isAuthenticated || !limitPrice || parseFloat(limitPrice) <= 0 || !limitSize || parseFloat(limitSize) <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const side = buySell === 'buy' ? OrderSide.BUY : OrderSide.SELL;
      let actualQuantity = limitSize;
      if (side === OrderSide.BUY && limitPrice && parseFloat(limitPrice) > 0) {
        const baseAmount = parseFloat(limitSize) / parseFloat(limitPrice);
        actualQuantity = baseAmount.toString();
      }

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

  return (
    <div className="flex flex-col justify-between h-full gap-3">
      <div className="flex flex-col gap-3">
        {/* Price Input */}
        <div className="bg-[#1A1A1A]/50 rounded-[16px] px-4 py-3 border border-[#E0E0E0]/10">
          <div className="flex items-center justify-between">
            <span className="text-[#A0A0A0] text-sm">Price</span>
            <div className="flex items-center gap-2">
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
                className="bg-transparent text-right text-xl font-bold text-[#E0E0E0] outline-none w-24 disabled:opacity-50"
              />
              <span className="text-[#E0E0E0] text-sm font-dm-sans">{quoteToken.symbol}</span>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-[#1A1A1A]/50 rounded-[16px] px-4 py-3 border border-[#E0E0E0]/10">
          <div className="flex items-center justify-between">
            <span className="text-[#A0A0A0] text-sm">Amount</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={limitSize}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setLimitSize(value);
                    // Update slider based on input
                    const availableBalance = buySell === 'buy'
                      ? parseFloat(quoteBalance.replace(/,/g, ''))
                      : parseFloat(baseBalance.replace(/,/g, ''));
                    if (availableBalance > 0) {
                      const percentage = (parseFloat(value || '0') / availableBalance) * 100;
                      setSliderValue(Math.min(100, percentage));
                    }
                  }
                }}
                placeholder="0"
                disabled={isPending || isConfirming || !isAuthenticated}
                className="bg-transparent text-right text-xl font-bold text-[#E0E0E0] outline-none w-24 disabled:opacity-50"
              />
              <span className="text-[#E0E0E0] text-sm font-dm-sans">{baseToken.symbol}</span>
            </div>
          </div>
        </div>

        {/* Percentage Slider */}
        <div className="flex flex-col gap-2">
          <div className="relative h-6 flex items-center">
            <div className="absolute w-full h-[2px] bg-[#4A4A4A] top-1/2 -translate-y-1/2 rounded-full pointer-events-none" />
            <div 
              className="absolute h-[2px] bg-[#F06718] top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{ width: `${sliderValue}%` }}
            />
            <div className="absolute w-full flex justify-between px-[2px] top-1/2 -translate-y-1/2 pointer-events-none z-1">
              {[0, 25, 50, 75, 100].map((step) => (
                <div
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full border-2 ${
                    sliderValue >= step ? 'bg-[#F06718] border-[#F06718]' : 'bg-[#4A4A4A] border-[#2A2A2A]'
                  }`}
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
              className="relative w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F06718]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[#F06718]
                [&::-moz-range-thumb]:cursor-pointer"
              style={{ background: 'transparent', height: '4px' }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#E0E0E0]/50">
            <span>0</span>
            <span>100%</span>
          </div>
        </div>

        {/* Time in Force */}
        <div className="flex items-center justify-between">
          <span className="text-[#A0A0A0] text-sm">Time in Force</span>
          <div className="relative">
            <select
              value={timeInForce}
              onChange={(e) => setTimeInForce(Number(e.target.value) as TimeInForce)}
              disabled={isPending || isConfirming || !isAuthenticated}
              className="px-3 py-2 bg-[#1A1A1A] border border-[#383838] rounded-lg text-[#E0E0E0] text-sm focus:outline-none focus:border-[#F06718] disabled:opacity-50 appearance-none cursor-pointer pr-8"
            >
              {timeInForceOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-[#A0A0A0]" />
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
          isSubmitting
        }
        className="relative w-full py-3 rounded-full font-medium transition-all text-white bg-[#E86A25] hover:bg-[#F07830] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_3px_6px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/20 before:to-transparent before:rounded-t-full"
      >
        <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2">
          {(isPending || isSubmitting) && <Loader2 className="w-5 h-5 animate-spin" />}
          {isPending || isSubmitting ? (
            buySell === 'buy' ? 'Placing Buy Order...' : 'Placing Sell Order...'
          ) : !isAuthenticated ? (
            'Connect Wallet'
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

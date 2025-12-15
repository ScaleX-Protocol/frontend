'use client';

import { getBlockExplorerTxUrl } from '@/configs/chain';
import { getTokenIcon } from '@/configs/tokens';
import { useTickerPrice } from '@/features/trade/hooks/chart/useTickerPrice';
import { OrderSide, Pool, TimeInForce, usePrivyPlaceOrder } from '@/features/trade/hooks/order/usePrivyPlaceOrder';
import { logger } from '@/utils/prodLogger';
import { AlertCircle, ChevronRight, Loader2, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Tooltip } from '@/components/ui/tooltip';

interface LimitOrderProps {
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
  baseBalance,
  quoteBalance,
  isLoadingBalance,
  baseToken,
  quoteToken,
  onBalanceRefresh
}: LimitOrderProps) {
 
  const [buySell, setBuySell] = useState<'buy' | 'sell'>('buy');
  const [limitPrice, setLimitPrice] = useState('');
  const [limitSize, setLimitSize] = useState('');
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
      // Format the raw price by dividing by 10^quoteDecimals
      const rawPrice = parseFloat(tickerPrice.price);
      const formattedPrice = rawPrice / Math.pow(10, quoteToken.decimals);
      setLimitPrice(formattedPrice.toString());
    }
  }, [tickerPrice?.price, limitPrice, quoteToken.decimals]);

  // Move all hooks to the top before any conditional returns
  const { placeLimitOrder, isPending, isConfirming, isAuthenticated, error } = usePrivyPlaceOrder({
    onSuccess: (hash, orderId) => {
      log.info('Limit order placed successfully', { hash, orderId, symbol, price: limitPrice, quantity: limitSize });
      // Store transaction hash for display
      setTransactionHash(hash);
      // Reset form on success
      setLimitPrice('');
      setLimitSize('');
      setIsSubmitting(false);
      // Refresh balance to show updated available amount
      if (onBalanceRefresh) {
        onBalanceRefresh();
      }
      // Clear transaction hash after 10 seconds
      setTimeout(() => setTransactionHash(null), 10000);
    },
    onError: (error) => {
      log.error('Limit order failed', { error: error.message, symbol, price: limitPrice, quantity: limitSize });
      setIsSubmitting(false);
    },
  });

  // Validate that required token information is provided
  if (!baseToken || !baseToken.address || !baseToken.symbol || !baseToken.decimals) {
    log.error('Missing base token info', undefined, {
      baseToken,
      baseTokenAddress: baseToken?.address,
      baseTokenSymbol: baseToken?.symbol,
      baseTokenDecimals: baseToken?.decimals,
    });
    return (
      <div className="flex items-center justify-center p-6 bg-[#2C2C2C] rounded-md min-h-[200px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#F06718] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">Missing Base Token Info</h3>
          <p className="text-sm text-[#E0E0E0]/70">Base token information is required to place limit orders.</p>
        </div>
      </div>
    );
  }
  if (!quoteToken || !quoteToken.address || !quoteToken.symbol || !quoteToken.decimals) {
    log.error('Missing quote token info', undefined, {
      quoteToken,
      quoteTokenAddress: quoteToken?.address,
      quoteTokenSymbol: quoteToken?.symbol,
      quoteTokenDecimals: quoteToken?.decimals,
    });
    return (
      <div className="flex items-center justify-center p-6 bg-[#2C2C2C] rounded-md min-h-[200px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#F06718] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">Missing Quote Token Info</h3>
          <p className="text-sm text-[#E0E0E0]/70">Quote token information is required to place limit orders.</p>
        </div>
      </div>
    );
  }

  // Pool configuration constructed from props
  const pool: Pool = {
    base: baseToken.address,
    quote: quoteToken.address,
    spacing: 1,
    fee: 3000 // 0.3%
  };

  // Handle quick action buttons
  const handleQuickAction = (percentage: number) => {
    // For BUY: use quote balance (how much to spend)
    // For SELL: use base balance (how much to sell)
    const availableBalance = buySell === 'buy'
      ? parseFloat(quoteBalance.replace(/,/g, ''))
      : parseFloat(baseBalance.replace(/,/g, ''));
    const amount = (availableBalance * percentage / 100);
    // Remove trailing zeros after decimal point only
    const formattedAmount = amount.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
    setLimitSize(formattedAmount);
  };

  // Calculate the actual trade amount
  // For BUY: limitSize is in quote currency (spend amount), calculate base amount (receive)
  // For SELL: limitSize is in base currency (sell amount)
  const getCalculatedAmount = () => {
    if (!limitSize || !limitPrice || parseFloat(limitPrice) === 0) return '0';

    if (buySell === 'buy') {
      // BUY: User enters quote amount to spend, calculate base amount to receive
      // baseAmount = quoteAmount / price
      const baseAmount = parseFloat(limitSize) / parseFloat(limitPrice);
      return baseAmount.toFixed(6);
    } else {
      // SELL: User enters base amount, calculate quote amount to receive
      // quoteAmount = baseAmount * price
      const quoteAmount = parseFloat(limitSize) * parseFloat(limitPrice);
      return quoteAmount.toFixed(2);
    }
  };

  const handleLimitOrder = async () => {
    if (!isAuthenticated || !limitPrice || parseFloat(limitPrice) <= 0 || !limitSize || parseFloat(limitSize) <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const side = buySell === 'buy' ? OrderSide.BUY : OrderSide.SELL;

      // For BUY: limitSize is in quote currency, convert to base currency
      // For SELL: limitSize is already in base currency
      let actualQuantity = limitSize;
      if (side === OrderSide.BUY && limitPrice && parseFloat(limitPrice) > 0) {
        // Convert quote amount to base amount: baseAmount = quoteAmount / price
        const baseAmount = parseFloat(limitSize) / parseFloat(limitPrice);
        actualQuantity = baseAmount.toString();
      }

      // Debug logging for checkbox states
      log.info('Placing limit order with flags', {
        side: buySell,
        inputAmount: limitSize,
        actualQuantity,
        price: limitPrice,
        autoRepayCheckbox: autoRepay,
        autoBorrowCheckbox: autoBorrow,
        finalAutoRepay: autoRepay,
        finalAutoBorrow: autoBorrow,
      });

      // IMPORTANT: Limit orders always use depositAmount: 0
      // Users must deposit to BalanceManager first before placing orders
      await placeLimitOrder({
        pool,
        price: limitPrice,
        quantity: actualQuantity, // For BUY: converted base amount, for SELL: original base amount
        side,
        timeInForce,
        depositAmount: '0', // Always 0 - use existing BalanceManager balance
        quantityDecimals: baseToken.decimals,
        // depositDecimals: for BUY orders = quote currency decimals, for SELL orders = base currency decimals
        depositDecimals: side === OrderSide.BUY ? quoteToken.decimals : baseToken.decimals,
        priceDecimals: quoteToken.decimals, // Price is in quote currency
        // Pass checkbox values directly
        autoRepay,
        autoBorrow
      });
    } catch {
      // Error is handled by the hook
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-4">
        {/* Buy/Sell Toggle */}
        <div className="flex">
          <button
            type="button"
            className={`flex-1 py-2 font-medium rounded-l-md ${
              buySell === 'buy' ? 'bg-[#4ADE80]/80 text-[#E0E0E0]' : 'bg-[#4ADE80]/40 text-[#E0E0E0]/70'
            }`}
            onClick={() => setBuySell('buy')}
          >
            BUY
          </button>
          <button
            type="button"
            className={`flex-1 py-2 font-medium rounded-r-md ${
              buySell === 'sell' ? 'bg-[#B91C1C]/80 text-[#E0E0E0]' : 'bg-[#B91C1C]/40 text-[#E0E0E0]/70'
            }`}
            onClick={() => setBuySell('sell')}
          >
            SELL
          </button>
        </div>

        {/* Price Card */}
        <div className="bg-[#1A1A1A]/50 rounded-2xl p-4 border border-[#E0E0E0]/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A0A0A0] text-sm">Price</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#1A1A1A] rounded-full border border-[#E0E0E0]/20">
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <img src={getTokenIcon(quoteToken.symbol)}
                  alt={quoteToken.symbol}


                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[#E0E0E0] font-medium text-sm">{quoteToken.symbol}</span>
            </div>

            <div className="flex-1 flex flex-col items-end min-w-0">
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
                className="w-full bg-transparent text-right text-2xl py-2 font-bold text-[#E0E0E0] outline-none disabled:opacity-50 overflow-hidden text-ellipsis"
              />
            </div>
          </div>
        </div>

        {/* Size Card */}
        <div className="bg-[#1A1A1A]/50 rounded-2xl p-4 border border-[#E0E0E0]/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A0A0A0] text-sm">
              {buySell === 'buy' ? 'Amount to Spend' : 'Amount to Sell'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickAction(0)}
                className="px-2 py-1 text-xs text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
                disabled={isPending || isConfirming || !isAuthenticated || isLoadingBalance}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction(50)}
                className="px-2 py-1 text-xs text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
                disabled={isPending || isConfirming || !isAuthenticated || isLoadingBalance}
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction(100)}
                className="px-2 py-1 text-xs text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
                disabled={isPending || isConfirming || !isAuthenticated || isLoadingBalance}
              >
                Max
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#1A1A1A] rounded-full border border-[#E0E0E0]/20">
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <img src={getTokenIcon(buySell === 'buy' ? quoteToken.symbol : baseToken.symbol)}
                  alt={buySell === 'buy' ? quoteToken.symbol : baseToken.symbol}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[#E0E0E0] font-medium text-sm">
                {buySell === 'buy' ? quoteToken.symbol : baseToken.symbol}
              </span>
            </div>

            <div className="flex-1 flex flex-col items-end min-w-0">
              <input
                type="text"
                value={limitSize}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setLimitSize(value);
                  }
                }}
                placeholder="0"
                disabled={isPending || isConfirming || !isAuthenticated}
                className="w-full bg-transparent text-right text-2xl py-2 font-bold text-[#E0E0E0] outline-none disabled:opacity-50 overflow-hidden text-ellipsis"
              />
              <span className="text-sm text-[#A0A0A0] mt-1 whitespace-nowrap">
                {isLoadingBalance
                  ? 'Loading...'
                  : buySell === 'buy'
                    ? `Balance: ${parseFloat(quoteBalance.replace(/,/g, '')).toFixed(3)} ${quoteToken.symbol}`
                    : `Balance: ${parseFloat(baseBalance.replace(/,/g, '')).toFixed(3)} ${baseToken.symbol}`
                }
              </span>
            </div>
          </div>

          {/* Show calculated amounts - only for BUY orders */}
          {buySell === 'buy' && limitSize && limitPrice && parseFloat(limitPrice) > 0 && (
            <div className="mt-3 pt-3 border-t border-[#E0E0E0]/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A0A0A0]">Order Size</span>
                <span className="text-[#E0E0E0] font-medium">
                  {getCalculatedAmount()} {baseToken.symbol}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Percentage Slider */}
        <div className="flex flex-col gap-1">
          <div className="relative h-6 flex items-center">
            <div className="absolute w-full h-[2px] bg-[#4A4A4A] top-1/2 -translate-y-1/2 rounded-full pointer-events-none" />

            <div className="absolute w-full flex justify-between px-[2px] top-1/2 -translate-y-1/2 pointer-events-none z-[1]">
              {[0, 25, 50, 75, 100].map((step) => (
                <div
                  key={step}
                  className="w-3 h-3 rounded-full bg-[#5A5A5A] border-2 border-[#2A2A2A]"
                />
              ))}
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={
                limitSize && !isLoadingBalance
                  ? (parseFloat(limitSize.replace(/,/g, '')) /
                     parseFloat(baseBalance.replace(/,/g, '')) * 100) || 0
                  : 0
              }
              onChange={(e) => {
                const percentage = parseFloat(e.target.value);
                const availableBalance = parseFloat(baseBalance.replace(/,/g, ''));
                const amount = (availableBalance * percentage / 100);
                const formattedAmount = amount.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
                setLimitSize(formattedAmount);
              }}
              disabled={isPending || isConfirming || !isAuthenticated || isLoadingBalance}
              className="relative w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed z-10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F06718]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[#F06718] [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: 'transparent',
                height: '4px'
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#E0E0E0]/70">
            <span>0</span>
            <span>100%</span>
          </div>
        </div>


        {/* Time in Force - Simple Inline */}
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[#A0A0A0]">Time in Force</span>
          <div className="relative">
            <select
              value={timeInForce}
              onChange={(e) => setTimeInForce(Number(e.target.value) as TimeInForce)}
              disabled={isPending || isConfirming || !isAuthenticated}
              className="px-3 py-1.5 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] text-sm focus:outline-none focus:border-[#F06718] disabled:opacity-50 appearance-none cursor-pointer pr-8"
            >
              <option value={TimeInForce.GTC}>Good &apos;Til Canceled</option>
              <option value={TimeInForce.IOC}>Immediate Or Cancel</option>
              <option value={TimeInForce.FOK}>Fill Or Kill</option>
              <option value={TimeInForce.PO}>Post Only</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronRight className="w-3 h-3 text-[#E0E0E0] rotate-90" />
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
                className="peer w-4 h-4 rounded border border-[#4A4A4A] bg-[#1A1A1A] appearance-none cursor-pointer disabled:opacity-50 checked:bg-[#F06718] checked:border-[#F06718] focus:ring-1 focus:ring-[#F06718] focus:ring-offset-0 transition-colors"
              />
              <svg
                className="absolute w-2.5 h-2.5 pointer-events-none hidden peer-checked:block text-[#1A1A1A]"
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

          <label className="flex items-center gap-2 cursor-pointer text-sm mb-2">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={autoRepay}
                onChange={(e) => setAutoRepay(e.target.checked)}
                disabled={isPending || isConfirming || !isAuthenticated}
                className="peer w-4 h-4 rounded border border-[#4A4A4A] bg-[#1A1A1A] appearance-none cursor-pointer disabled:opacity-50 checked:bg-[#F06718] checked:border-[#F06718] focus:ring-1 focus:ring-[#F06718] focus:ring-offset-0 transition-colors"
              />
              <svg
                className="absolute w-2.5 h-2.5 pointer-events-none hidden peer-checked:block text-[#1A1A1A]"
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
          <div className="p-2 rounded bg-red-900/20 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error.message}</span>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {isConfirming && (
          <div className="p-2 rounded bg-yellow-900/20 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Waiting for confirmation...</span>
            </div>
          </div>
        )}

        {/* Transaction Success */}
        {transactionHash && (
          <div className="p-2 rounded bg-green-900/20 border border-green-500/20">
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
        className={`w-full py-3 font-bold text-lg rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center justify-center gap-2 text-white ${
          buySell === 'buy'
            ? 'bg-[#4ADE80] hover:bg-[#4ADE80]/80 disabled:hover:bg-[#4ADE80]'
            : 'bg-[#B91C1C] hover:bg-[#B91C1C]/80 disabled:hover:bg-[#B91C1C]'
        }`}
      >
        {isPending || isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
        {isPending || isSubmitting ? (
          buySell === 'buy' ? 'PLACING BUY ORDER...' : 'PLACING SELL ORDER...'
        ) : !isAuthenticated ? (
          'CONNECT WALLET'
        ) : !limitPrice || parseFloat(limitPrice) <= 0 || !limitSize || parseFloat(limitSize) <= 0 ? (
          'ENTER PRICE AND SIZE'
        ) : (
          buySell === 'buy' ? `PLACE BUY ORDER` : `PLACE SELL ORDER`
        )}
      </button>
    </div>
  );
}

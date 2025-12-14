'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { usePrivyPlaceOrder, OrderSide, Pool } from '@/features/trade/hooks/order/usePrivyPlaceOrder';
import { useTradingRules } from '@/features/trade/hooks/useTradingRules';
import { getBlockExplorerTxUrl } from '@/configs/chain';
import { logger } from '@/utils/prodLogger';
import { getTokenIcon } from '@/configs/tokens';

interface MarketOrderProps {
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

const log = logger.withContext({ component: 'MarketOrder' });

export default function MarketOrder({
  baseBalance,
  quoteBalance,
  isLoadingBalance,
  baseToken,
  quoteToken,
  onBalanceRefresh
}: MarketOrderProps) {
  const [buySell, setBuySell] = useState<'buy' | 'sell'>('buy');
  const [marketSize, setMarketSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Move all hooks to the top before any conditional returns
  const { placeMarketOrder, isPending, isConfirming, isAuthenticated, error } = usePrivyPlaceOrder({
    onSuccess: (hash, orderId) => {
      log.info('Market order placed successfully', { hash, orderId, symbol: `${baseToken.symbol}/${quoteToken.symbol}` });
      // Store transaction hash for display
      setTransactionHash(hash);
      // Reset form on success
      setMarketSize('');
      setIsSubmitting(false);
      // Refresh balance to show updated available amount
      if (onBalanceRefresh) {
        onBalanceRefresh();
      }
      // Clear transaction hash after 10 seconds
      setTimeout(() => setTransactionHash(null), 10000);
    },
    onError: (error) => {
      log.error('Market order failed', { error: error.message, symbol: `${baseToken.symbol}/${quoteToken.symbol}` });
      setIsSubmitting(false);
    },
  });

  // Fetch trading rules dynamically based on selected market (moved before early returns)
  const { tradingRules } = useTradingRules({
    baseTokenAddress: baseToken.address,
    quoteTokenAddress: quoteToken.address,
  });

  // Validate that required token information is provided
  if (!baseToken || !baseToken.symbol || baseToken.decimals === undefined) {
    return (
      <div className="flex items-center justify-center p-6 bg-[#2C2C2C] rounded-md min-h-[200px]">
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
      <div className="flex items-center justify-center p-6 bg-[#2C2C2C] rounded-md min-h-[200px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#F06718] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#E0E0E0] mb-2">Missing Quote Token Info</h3>
          <p className="text-sm text-[#E0E0E0]/70">Quote token information is required to place market orders.</p>
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

  // Helper function to determine decimal places based on trading rules
  // Maximum 3 decimal places for display
  const getDisplayDecimals = (minTradeAmount?: bigint, tokenDecimals?: number): number => {
    // If we have trading rules, use them to determine precision
    if (minTradeAmount && tokenDecimals) {
      const minTradeNum = Number(minTradeAmount) / Math.pow(10, tokenDecimals);

      // Count decimal places in min trade amount
      const minTradeStr = minTradeNum.toFixed(tokenDecimals);
      const decimalPart = minTradeStr.split('.')[1];
      if (decimalPart) {
        // Find the position of the first non-zero digit
        const firstNonZero = decimalPart.search(/[1-9]/);
        if (firstNonZero >= 0) {
          // Show at least 2 more decimals after the first significant digit
          // But cap at maximum 3 decimals
          const calculatedDecimals = Math.min(firstNonZero + 4, tokenDecimals);
          return Math.min(calculatedDecimals, 3);
        }
      }
    }

    // Fallback: hardcoded to 3 decimal places maximum
    return 3;
  };

  const handleMarketOrder = async () => {
    if (!isAuthenticated || !marketSize || parseFloat(marketSize) <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const side = buySell === 'buy' ? OrderSide.BUY : OrderSide.SELL;

      // IMPORTANT: Market orders always use depositAmount: 0
      // Users must deposit to BalanceManager first before placing orders
      // This matches the pattern in MarketOrderBook.sol script (line 188, 228)
      //
      // For BUY orders: user inputs quote currency amount (how much to spend)
      // For SELL orders: user inputs base currency amount (how much to sell)
      //
      // The contract expects quantity in base currency, so for BUY we pass quote amount
      // which will be interpreted by the contract to buy that much worth of base currency
      await placeMarketOrder({
        pool,
        quantity: marketSize,
        side,
        depositAmount: '0', // Always 0 - use existing BalanceManager balance
        // For BUY: quantity is in quote currency (user's input)
        // For SELL: quantity is in base currency (user's input)
        quantityDecimals: side === OrderSide.BUY ? quoteToken.decimals : baseToken.decimals,
        depositDecimals: side === OrderSide.BUY ? quoteToken.decimals : baseToken.decimals,
        autoRepay: false,
        autoBorrow: false
      });
    } catch (error) {
      // Error is handled by the hook
      setIsSubmitting(false);
    }
  };

  // Handle quick action buttons
  const handleQuickAction = (percentage: number) => {
    const availableBalance = parseFloat((buySell === 'buy' ? quoteBalance : baseBalance).replace(/,/g, ''));
    const amount = (availableBalance * percentage / 100);
    // Remove trailing zeros after decimal point only
    const formattedAmount = amount.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
    setMarketSize(formattedAmount);
  };

  // Get current token based on buy/sell
  const currentToken = buySell === 'buy' ? quoteToken : baseToken;
  const currentBalance = buySell === 'buy' ? quoteBalance : baseBalance;

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

        {/* Main Order Card */}
        <div className="bg-[#1A1A1A]/50 rounded-2xl p-4 border border-[#E0E0E0]/10">
          {/* Header with Quick Actions */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A0A0A0] text-sm">
              {buySell === 'buy' ? 'Buy' : 'Sell'}
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

          {/* Token Selector and Amount Input */}
          <div className="flex items-center justify-between gap-3">
            {/* Token Display (non-clickable since it's determined by market) */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#1A1A1A] rounded-full border border-[#E0E0E0]/20">
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <img src={getTokenIcon(currentToken.symbol)}
                  alt={currentToken.symbol}


                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[#E0E0E0] font-medium text-sm">{currentToken.symbol}</span>
            </div>

            {/* Large Amount Input */}
            <div className="flex-1 flex flex-col items-end min-w-0">
              <input
                type="text"
                value={marketSize}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setMarketSize(value);
                  }
                }}
                placeholder="0"
                disabled={isPending || isConfirming || !isAuthenticated}
                className="w-full bg-transparent text-right text-2xl py-2 font-bold text-[#E0E0E0] outline-none disabled:opacity-50 overflow-hidden text-ellipsis"
              />
              {/* Balance Display */}
              <span className="text-sm text-[#A0A0A0] mt-1 whitespace-nowrap">
                {isLoadingBalance
                  ? 'Loading...'
                  : `Balance: ${parseFloat(currentBalance.replace(/,/g, '')).toFixed(
                      getDisplayDecimals(tradingRules?.minTradeAmount, currentToken.decimals)
                    )} ${currentToken.symbol}`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Percentage Slider */}
        <div className="flex flex-col gap-1">
          <div className="relative h-6 flex items-center">
            {/* Track line */}
            <div className="absolute w-full h-[2px] bg-[#4A4A4A] top-1/2 -translate-y-1/2 rounded-full pointer-events-none" />

            {/* Step markers */}
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
                marketSize && !isLoadingBalance
                  ? (parseFloat(marketSize.replace(/,/g, '')) /
                     parseFloat(currentBalance.replace(/,/g, '')) * 100) || 0
                  : 0
              }
              onChange={(e) => {
                const percentage = parseFloat(e.target.value);
                const availableBalance = parseFloat(currentBalance.replace(/,/g, ''));
                const amount = (availableBalance * percentage / 100);
                const formattedAmount = amount.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
                setMarketSize(formattedAmount);
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

        {/* Estimated Output */}
        {marketSize && parseFloat(marketSize) > 0 && (
          <div className="text-sm text-[#A0A0A0]">
            {buySell === 'buy'
              ? `Est. receive: ~${(parseFloat(marketSize) / 3000).toFixed(6)} ${baseToken.symbol}`
              : `Est. receive: ~${(parseFloat(marketSize) * 3000).toFixed(2)} ${quoteToken.symbol}`
            }
          </div>
        )}

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
        onClick={handleMarketOrder}
        disabled={
          !isAuthenticated ||
          !marketSize ||
          parseFloat(marketSize) <= 0 ||
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
          buySell === 'buy' ? 'BUYING...' : 'SELLING...'
        ) : !isAuthenticated ? (
          'CONNECT WALLET'
        ) : !marketSize || parseFloat(marketSize) <= 0 ? (
          'ENTER AN AMOUNT'
        ) : (
          buySell === 'buy' ? `BUY ${baseToken.symbol}` : `SELL ${baseToken.symbol}`
        )}
      </button>
    </div>
  );
}

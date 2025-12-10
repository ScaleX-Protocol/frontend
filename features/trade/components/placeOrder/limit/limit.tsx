'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyPlaceOrder, OrderSide, TimeInForce, Pool } from '@/features/trade/hooks/order/usePrivyPlaceOrder';
import { getBlockExplorerTxUrl } from '@/configs/chain';
import { useTickerPrice } from '@/features/trade/hooks/chart/useTickerPrice';

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

  // Fetch current market price to set as default
  const symbol = `${baseToken.symbol}/${quoteToken.symbol}`;
  const { data: tickerPrice } = useTickerPrice(symbol);

  // Set default price when ticker price is available
  useEffect(() => {
    if (tickerPrice?.price && !limitPrice) {
      setLimitPrice(tickerPrice.price);
    }
  }, [tickerPrice?.price, limitPrice]);

  // Move all hooks to the top before any conditional returns
  const { placeLimitOrder, isPending, isConfirming, error, isAuthenticated, address } = usePrivyPlaceOrder({
    onSuccess: (hash, orderId) => {
      console.log('Limit order placed successfully:', { hash, orderId });
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
      console.error('Limit order failed:', error);
      setIsSubmitting(false);
    },
  });

  // Validate that required token information is provided
  if (!baseToken || !baseToken.address || !baseToken.symbol || !baseToken.decimals) {
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

  const handleLimitOrder = async () => {
    if (!isAuthenticated || !limitPrice || parseFloat(limitPrice) <= 0 || !limitSize || parseFloat(limitSize) <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const side = buySell === 'buy' ? OrderSide.BUY : OrderSide.SELL;

      // IMPORTANT: Limit orders always use depositAmount: 0
      // Users must deposit to BalanceManager first before placing orders
      await placeLimitOrder({
        pool,
        price: limitPrice,
        quantity: limitSize,
        side,
        timeInForce,
        depositAmount: '0', // Always 0 - use existing BalanceManager balance
        quantityDecimals: baseToken.decimals,
        // depositDecimals: for BUY orders = quote currency decimals, for SELL orders = base currency decimals
        depositDecimals: side === OrderSide.BUY ? quoteToken.decimals : baseToken.decimals,
        priceDecimals: quoteToken.decimals, // Price is in quote currency
        autoRepay: false,
        autoBorrow: false
      });
    } catch (error) {
      // Error is handled by the hook
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-4">
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

        <div className="flex justify-between items-center text-[#E0E0E0]">
          <span className="text-xs">Available to trade</span>
          <span className="text-[12px] font-medium">
            {isLoadingBalance
              ? 'Loading...'
              : buySell === 'buy'
                ? `${parseFloat(quoteBalance.replace(/,/g, '')).toFixed(3)} ${quoteToken.symbol}`
                : `${parseFloat(baseBalance.replace(/,/g, '')).toFixed(3)} ${baseToken.symbol}`
            }
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="0.00"
            disabled={isPending || isConfirming || !isAuthenticated}
            className="w-full pl-16 pr-20 py-2 text-right border border-[#E0E0E0]/20 rounded-md focus:outline-none focus:ring focus:ring-[#E0E0E0]/40 disabled:opacity-50 bg-[#1A1A1A] text-[#E0E0E0]"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-[#E0E0E0]/70">Price</span>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-[#E0E0E0] font-medium">{quoteToken.symbol}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              value={limitSize}
              onChange={(e) => setLimitSize(e.target.value)}
              placeholder="0.00"
              disabled={isPending || isConfirming || !isAuthenticated}
              className="w-full pl-16 pr-20 py-2 text-right border border-[#E0E0E0]/20 rounded-md focus:outline-none focus:ring focus:ring-[#E0E0E0]/40 disabled:opacity-50 bg-[#1A1A1A] text-[#E0E0E0]"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-[#E0E0E0]/70">Size</span>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-[#E0E0E0] font-medium">{baseToken.symbol}</span>
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
                  limitSize && !isLoadingBalance
                    ? (parseFloat(limitSize.replace(/,/g, '')) /
                       parseFloat(baseBalance.replace(/,/g, '')) * 100) || 0
                    : 0
                }
                onChange={(e) => {
                  const percentage = parseFloat(e.target.value);
                  const availableBalance = parseFloat(baseBalance.replace(/,/g, ''));
                  const amount = (availableBalance * percentage / 100).toFixed(6);
                  setLimitSize(amount);
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

          {limitSize && limitPrice && parseFloat(limitSize) > 0 && parseFloat(limitPrice) > 0 && (
            <div className="text-right text-xs text-white">
              {buySell === 'buy'
                ? `Est. cost: ~${(parseFloat(limitSize) * parseFloat(limitPrice)).toFixed(2)} ${quoteToken.symbol}`
                : `Est. receive: ~${(parseFloat(limitSize) * parseFloat(limitPrice)).toFixed(2)} ${quoteToken.symbol}`
              }
            </div>
          )}
        </div>

        <div>
          <label className="text-[#A0A0A0] text-sm block mb-1">Time in Force</label>
          <select
            value={timeInForce}
            onChange={(e) => setTimeInForce(Number(e.target.value) as TimeInForce)}
            disabled={isPending || isConfirming || !isAuthenticated}
            className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#F06718] disabled:opacity-50"
          >
            <option value={TimeInForce.GTC}>Good &apos;Til Canceled</option>
            <option value={TimeInForce.IOC}>Immediate Or Cancel</option>
            <option value={TimeInForce.FOK}>Fill Or Kill</option>
            <option value={TimeInForce.PO}>Post Only</option>
          </select>
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
        className={`w-full py-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          buySell === 'buy'
            ? 'bg-green-500 hover:bg-green-600 text-white disabled:hover:bg-green-500'
            : 'bg-red-500 hover:bg-red-600 text-white disabled:hover:bg-red-500'
        }`}
      >
        {isPending || isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {buySell === 'buy' ? 'Placing Buy Order...' : 'Placing Sell Order...'}
          </div>
        ) : (
          <>{buySell === 'buy' ? `Place Buy Order` : `Place Sell Order`}</>
        )}
      </button>
    </div>
  );
}

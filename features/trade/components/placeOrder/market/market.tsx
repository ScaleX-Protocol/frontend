'use client';

import { Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyPlaceOrder, OrderSide, Pool } from '@/features/trade/hooks/order/usePrivyPlaceOrder';

interface MarketOrderProps {
  availableToTrade: string;
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
}

export default function MarketOrder({
  availableToTrade,
  isLoadingBalance,
  baseToken,
  quoteToken
}: MarketOrderProps) {
  const [buySell, setBuySell] = useState<'buy' | 'sell'>('buy');
  const [marketSize, setMarketSize] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Move all hooks to the top before any conditional returns
  const { placeMarketOrder, isPending, isConfirming, error, isAuthenticated, address } = usePrivyPlaceOrder({
    onSuccess: (hash, orderId) => {
      console.log('Market order placed successfully:', { hash, orderId });
      // Reset form on success
      setMarketSize('');
      setDepositAmount('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Market order failed:', error);
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
          <p className="text-sm text-[#E0E0E0]/70">Base token information is required to place market orders.</p>
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

  const handleMarketOrder = async () => {
    if (!isAuthenticated || !marketSize || parseFloat(marketSize) <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const side = buySell === 'buy' ? OrderSide.BUY : OrderSide.SELL;

      // Calculate deposit amount based on order type (following smart contract logic)
      let finalDepositAmount = '0';
      
      if (depositAmount && parseFloat(depositAmount) > 0) {
        // Use explicit deposit amount if specified
        finalDepositAmount = depositAmount;
      } else {
        // Smart contract logic: 
        // - BUY orders: calculate USDC needed (price * quantity)
        // - SELL orders: deposit amount = ETH quantity
        if (side === OrderSide.BUY) {
          // For BUY: estimate USDC needed (rough calculation - should use real price)
          const estimatedPrice = 3000; // $3000 per ETH estimate
          finalDepositAmount = (parseFloat(marketSize) * estimatedPrice).toString();
        } else {
          // For SELL: deposit amount = ETH quantity
          finalDepositAmount = marketSize;
        }
      }
      
      await placeMarketOrder({
        pool,
        quantity: marketSize,
        side,
        depositAmount: finalDepositAmount,
        decimals: baseToken.decimals,
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
          <span>Available to trade</span>
          <div className="flex flex-row gap-1">
            <Wallet />
            <span className="font-medium">
              {isLoadingBalance ? 'Loading...' : availableToTrade}
            </span>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={marketSize}
            onChange={(e) => setMarketSize(e.target.value)}
            placeholder="0.00"
            disabled={isPending || isConfirming || !isAuthenticated}
            className="w-full pl-16 pr-20 py-2 text-left border border-[#E0E0E0]/20 rounded-md focus:outline-none focus:ring focus:ring-[#E0E0E0]/40 disabled:opacity-50 bg-[#1A1A1A] text-[#E0E0E0]"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-[#E0E0E0]/70">{buySell === 'buy' ? 'Buy Amount' : 'Sell Amount'}</span>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-[#E0E0E0] font-medium">{baseToken.symbol}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="relative">
            <input
              type="text"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00 (optional)"
              disabled={isPending || isConfirming || !isAuthenticated}
              className="w-full pl-20 pr-20 py-2 text-left border border-[#E0E0E0]/20 rounded-md focus:outline-none focus:ring focus:ring-[#E0E0E0]/40 disabled:opacity-50 bg-[#1A1A1A] text-[#E0E0E0]"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-[#E0E0E0]/70">Deposit</span>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-[#E0E0E0] font-medium">{quoteToken.symbol}</span>
            </div>
          </div>
          <span className="text-xs text-[#E0E0E0]/50 px-1">
            {buySell === 'buy' 
              ? 'Leave empty to auto-calculate USDC needed'
              : 'Leave empty to use existing balance'
            }
          </span>
        </div>

        {/* Order Preview */}
        {marketSize && parseFloat(marketSize) > 0 && (
          <div className="p-2 rounded bg-blue-900/20 border border-blue-500/20">
            <div className="text-xs text-blue-400">
              <div className="font-medium mb-1">Market Order Preview:</div>
              {buySell === 'buy' ? (
                <div>
                  <div>• You want to buy: {marketSize} {baseToken.symbol}</div>
                  <div>• Est. cost: ~{(parseFloat(marketSize) * 3000).toFixed(2)} {quoteToken.symbol}</div>
                  <div className="text-[10px] mt-1 text-blue-300">Will execute against best sell orders</div>
                </div>
              ) : (
                <div>
                  <div>• You want to sell: {marketSize} {baseToken.symbol}</div>
                  <div>• Est. receive: ~{(parseFloat(marketSize) * 3000).toFixed(2)} {quoteToken.symbol}</div>
                  <div className="text-[10px] mt-1 text-blue-300">Will execute against best buy orders</div>
                </div>
              )}
            </div>
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
        className={`w-full py-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          buySell === 'buy'
            ? 'bg-green-500 hover:bg-green-600 text-white disabled:hover:bg-green-500'
            : 'bg-red-500 hover:bg-red-600 text-white disabled:hover:bg-red-500'
        }`}
      >
        {isPending || isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {buySell === 'buy' ? 'Buying...' : 'Selling...'}
          </div>
        ) : (
          <>{buySell === 'buy' ? `Buy ${baseToken.symbol}` : `Sell ${baseToken.symbol}`}</>
        )}
      </button>
    </div>
  );
}

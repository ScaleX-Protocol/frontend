'use client';

import { useState } from 'react';
import { useAccount } from '@/features/trade/hooks/history/useAccount';
import { useWalletState } from '@/hooks/useWalletState';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTradeBalances } from '@/features/trade/hooks/useTradeBalances';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LimitOrder from './limit/limit';
import MarketOrder from './market/market';
import Swap from './swap/swap';

interface PlaceOrderProps {
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

export default function PlaceOrder({ baseToken, quoteToken }: PlaceOrderProps) {
  const [activeTab, setActiveTab] = useState<'market' | 'limit' | 'swap'>('market');

  // Fetch account balance data once at the parent level
  const wallet = useWalletState();
  const { data: accountData, isLoading: isLoadingBalance, refetch: refetchBalance } = useAccount(wallet.embeddedWallet.address);
  const { data: currenciesData } = useCurrencies();

  // Calculate available balances using custom hook
  const balances = useTradeBalances({
    accountBalances: accountData?.balances as any[],
    currenciesData,
    baseCurrencySymbol: baseToken.symbol,
  });

  return (
    <div className="w-full h-full bg-[#2C2C2C] rounded-md p-2">
      <div className="flex flex-col gap-2 h-full">
        <div className="flex border-b border-[#E0E0E0]/20 pb-2">
          <button
            type="button"
            className={`flex-1 py-[3px] text-center font-bold transition-colors rounded-md ${
              activeTab === 'market' ? 'text-[#E0E0E0] bg-[#F06718]/70' : 'text-[#E0E0E0]/70 hover:text-[#E0E0E0]/90'
            }`}
            onClick={() => setActiveTab('market')}
          >
            Market
          </button>
          <button
            type="button"
            className={`flex-1 py-[3px] text-center font-bold transition-colors rounded-md ${
              activeTab === 'limit' ? 'text-[#E0E0E0] bg-[#F06718]/70' : 'text-[#E0E0E0]/70 hover:text-[#E0E0E0]/90'
            }`}
            onClick={() => setActiveTab('limit')}
          >
            Limit
          </button>
          <button
            type="button"
            className={`flex-1 py-[3px] text-center font-bold transition-colors rounded-md ${
              activeTab === 'swap' ? 'text-[#E0E0E0] bg-[#F06718]/70' : 'text-[#E0E0E0]/70 hover:text-[#E0E0E0]/90'
            }`}
            onClick={() => setActiveTab('swap')}
          >
            Swap
          </button>
        </div>

        {activeTab === 'market' && (
          <ErrorBoundary>
            <MarketOrder
              baseBalance={balances.baseCurrencyBalance}
              quoteBalance={balances.quoteCurrencyBalance}
              isLoadingBalance={isLoadingBalance}
              baseToken={baseToken}
              quoteToken={quoteToken}
              onBalanceRefresh={refetchBalance}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'limit' && (
          <ErrorBoundary>
            <LimitOrder
              baseBalance={balances.baseCurrencyBalance}
              quoteBalance={balances.quoteCurrencyBalance}
              isLoadingBalance={isLoadingBalance}
              baseToken={baseToken}
              quoteToken={quoteToken}
              onBalanceRefresh={refetchBalance}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'swap' && (
          <ErrorBoundary>
            <Swap balances={balances.rawBalances} isLoadingBalance={isLoadingBalance} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

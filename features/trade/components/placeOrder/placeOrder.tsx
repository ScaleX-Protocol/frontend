'use client';

import { useState, useMemo } from 'react';
import { useAccount } from '@/features/trade/hooks/history/useAccount';
import { useWalletState } from '@/hooks/useWalletState';
import { TradingConfig } from '@/configs/trading';
import LimitOrder from './limit/limit';
import MarketOrder from './market/market';
import Swap from './swap/swap';

export default function PlaceOrder() {
  const [activeTab, setActiveTab] = useState<'market' | 'limit' | 'swap'>('market');

  // Fetch account balance data once at the parent level
  const wallet = useWalletState();
  const { data: accountData, isLoading: isLoadingBalance } = useAccount(wallet.embeddedWallet.address);

  // Calculate available balances for different assets
  const balances = useMemo(() => {
    if (!accountData?.balances) {
      return {
        quoteCurrencyBalance: '0',
        rawBalances: [],
      };
    }

    const quoteCurrency = TradingConfig.quoteCurrency;
    const balanceCurrency = quoteCurrency.startsWith('gs') ? quoteCurrency.substring(2) : quoteCurrency;

    const quoteBalance = (accountData.balances as any[]).find(
      (balance: any) => balance.asset === balanceCurrency || balance.symbol === balanceCurrency
    );

    const quoteFree = parseFloat(quoteBalance?.free || quoteBalance?.available || '0');

    return {
      quoteCurrencyBalance: quoteFree.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      rawBalances: accountData.balances as any[],
    };
  }, [accountData]);

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
          <MarketOrder
            availableToTrade={balances.quoteCurrencyBalance}
            isLoadingBalance={isLoadingBalance}
          />
        )}

        {activeTab === 'limit' && (
          <LimitOrder
            availableToTrade={balances.quoteCurrencyBalance}
            isLoadingBalance={isLoadingBalance}
          />
        )}

        {activeTab === 'swap' && (
          <Swap balances={balances.rawBalances} isLoadingBalance={isLoadingBalance} />
        )}
      </div>
    </div>
  );
}

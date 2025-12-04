'use client';

import { useState, useMemo } from 'react';
import { useAccount } from '@/features/trade/hooks/history/useAccount';
import { useWalletState } from '@/hooks/useWalletState';
import { TradingConfig } from '@/configs/trading';
import { useCurrencies } from '@/hooks/useCurrencies';
import { ErrorBoundary, SafeComponent } from '@/components/ErrorBoundary';
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
  const { data: accountData, isLoading: isLoadingBalance } = useAccount(wallet.embeddedWallet.address);
  const { data: currenciesData } = useCurrencies();

  // Calculate available balances for different assets
  const balances = useMemo(() => {
    if (!accountData?.balances) {
      return {
        quoteCurrencyBalance: '0',
        rawBalances: [],
      };
    }

    const quoteCurrency = TradingConfig.quoteCurrency;

    const quoteBalance = (accountData.balances as unknown as Array<{asset?: string, symbol?: string, free?: string, available?: string}>).find(
      (balance) => balance.asset === quoteCurrency || balance.symbol === quoteCurrency
    );

    const quoteFreeRaw = parseFloat(quoteBalance?.free || quoteBalance?.available || '0');

    // Find the currency to get decimals
    const currency = currenciesData?.data?.items?.find(
      (c: any) => c.symbol === quoteCurrency
    );
    const decimals = currency?.decimals || 6; // Default to 6 for USDC-like tokens

    // Convert raw balance to human-readable format
    const quoteFreeFormatted = quoteFreeRaw / Math.pow(10, decimals);

    return {
      quoteCurrencyBalance: quoteFreeFormatted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      rawBalances: accountData.balances as any[],
    };
  }, [accountData, currenciesData]);

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
              availableToTrade={balances.quoteCurrencyBalance}
              isLoadingBalance={isLoadingBalance}
              baseToken={baseToken}
              quoteToken={quoteToken}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'limit' && (
          <ErrorBoundary>
            <LimitOrder
              availableToTrade={balances.quoteCurrencyBalance}
              isLoadingBalance={isLoadingBalance}
              baseToken={baseToken}
              quoteToken={quoteToken}
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

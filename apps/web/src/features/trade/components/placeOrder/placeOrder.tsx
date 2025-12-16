'use client';

import { useState } from 'react';
import { useAccount } from '@/features/trade/hooks/history/useAccount';
import { useWalletState } from '@scalex/service-wallet';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTradeBalances } from '@/features/trade/hooks/useTradeBalances';
import { useContractBalance } from '@/features/trade/hooks/useContractBalance';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/utils/prodLogger';
import LimitOrder from './limit/limit';
import MarketOrder from './market/market';
import Swap from './swap/swap';

const log = logger.withContext({ component: '[Limit Issue] PlaceOrder' });

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

  // Debug logging - log props on every render
  log.info('PlaceOrder component props', {
    activeTab,
    baseToken: {
      address: baseToken?.address,
      symbol: baseToken?.symbol,
      decimals: baseToken?.decimals,
      exists: !!baseToken,
    },
    quoteToken: {
      address: quoteToken?.address,
      symbol: quoteToken?.symbol,
      decimals: quoteToken?.decimals,
      exists: !!quoteToken,
    },
  });

  // Fetch account balance data once at the parent level
  const wallet = useWalletState();

  log.info('Wallet state', {
    isConnected: wallet.isConnected,
    isReady: wallet.isReady,
    embeddedAddress: wallet.embeddedWallet.address,
    embeddedChainId: wallet.embeddedWallet.chainId,
  });

  const { data: accountData, isLoading: isLoadingIndexerBalance, refetch: refetchBalance } = useAccount(wallet.embeddedWallet.address);
  const { data: currenciesData } = useCurrencies();

  log.info('Data fetching status', {
    hasAccountData: !!accountData,
    hasCurrenciesData: !!currenciesData,
    isLoadingIndexerBalance,
    currenciesCount: currenciesData?.data?.items?.length,
  });

  // Get actual available balance from smart contract (includes yield)
  const baseContractBalance = useContractBalance({
    userAddress: wallet.embeddedWallet.address as `0x${string}`,
    currencyAddress: baseToken.address as `0x${string}`,
    decimals: baseToken.decimals,
  });

  const quoteContractBalance = useContractBalance({
    userAddress: wallet.embeddedWallet.address as `0x${string}`,
    currencyAddress: quoteToken.address as `0x${string}`,
    decimals: quoteToken.decimals,
  });

  // Calculate available balances using custom hook (fallback to indexer data)
  const indexerBalances = useTradeBalances({
    accountBalances: accountData?.balances as any[],
    currenciesData,
    baseCurrencySymbol: baseToken.symbol,
  });

  // Use contract balances (includes yield) if available, otherwise fall back to indexer
  const balances = {
    baseCurrencyBalance: baseContractBalance.formattedString || indexerBalances.baseCurrencyBalance,
    quoteCurrencyBalance: quoteContractBalance.formattedString || indexerBalances.quoteCurrencyBalance,
    rawBalances: indexerBalances.rawBalances,
  };

  const isLoadingBalance = isLoadingIndexerBalance || baseContractBalance.isLoading || quoteContractBalance.isLoading;

  const handleRefreshBalance = () => {
    refetchBalance();
    baseContractBalance.refetch();
    quoteContractBalance.refetch();
  };

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
              onBalanceRefresh={handleRefreshBalance}
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
              onBalanceRefresh={handleRefreshBalance}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'swap' && (
          <ErrorBoundary>
            <Swap
              balances={balances.rawBalances}
              isLoadingBalance={isLoadingBalance}
              baseToken={baseToken}
              quoteToken={quoteToken}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

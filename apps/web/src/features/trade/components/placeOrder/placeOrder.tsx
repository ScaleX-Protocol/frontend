'use client';

import { useState } from 'react';
import { useAccount } from '@/features/trade/hooks/history/useAccount';
import { useWalletState } from '@scalex/service-wallet';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useTradeBalances } from '@/features/trade/hooks/useTradeBalances';
import { useContractBalance } from '@/features/trade/hooks/useContractBalance';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/utils/prodLogger';
import { PlusCircle } from 'lucide-react';
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
  const [buySell, setBuySell] = useState<'buy' | 'sell'>('buy');
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

  // Get available balance based on buy/sell
  const availableBalance = buySell === 'buy' 
    ? balances.quoteCurrencyBalance 
    : balances.baseCurrencyBalance;
  const availableSymbol = buySell === 'buy' 
    ? quoteToken.symbol
    : baseToken.symbol;

  return (
    <div className="w-full h-full bg-[#242424] rounded-[20px] border border-[#404040] px-4 py-[18px] flex flex-col">
      <div className="flex flex-col gap-3 h-full">
        {/* Buy/Sell Toggle */}
        <div className="flex bg-[#111111] rounded-md p-1 gap-1 border border-[#222222]">
          <button
            type="button"
            className={`flex-1 py-1.5 text-center font-dm-sans text-sm rounded-[4px] ${
              buySell === 'buy' 
                ? 'bg-[#222222] border border-[#333333] text-[#FFFFFF]' 
                : 'text-[#666666] hover:text-[#E0E0E0]/70'
            }`}
            onClick={() => setBuySell('buy')}
          >
            Buy
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-center font-dm-sans text-sm rounded-[4px] ${
              buySell === 'sell' 
                ? 'bg-[#222222] border border-[#333333] text-[#FFFFFF]' 
                : 'text-[#666666] hover:text-[#E0E0E0]/70'
            }`}
            onClick={() => setBuySell('sell')}
          >
            Sell
          </button>
        </div>

        {/* Market/Limit/Swap Tabs */}
        <div className="flex border-b border-[#E0E0E0]/20">
          <button
            type="button"
            className={`py-2 text-xs font-dm-sans w-full text-[#E0E0E0]/70 relative`}
            onClick={() => setActiveTab('market')}
          >
            Market
            {activeTab === 'market' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F06718]" />
            )}
          </button>
          <button
            type="button"
            className={`py-2 text-xs font-dm-sans w-full text-[#E0E0E0]/70 relative`}
            onClick={() => setActiveTab('limit')}
          >
            Limit
            {activeTab === 'limit' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F06718]" />
            )}
          </button>
          <button
            type="button"
            className={`py-2 text-xs font-dm-sans w-full text-[#E0E0E0]/70 relative`}
            onClick={() => setActiveTab('swap')}
          >
            Swap
            {activeTab === 'swap' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F06718]" />
            )}
          </button>
        </div>

        {/* Available Balance */}
        <div className="flex items-center justify-end gap-1 text-sm">
          <span className="text-[#A0A0A0]">Available:</span>
          <span className="text-[#E0E0E0]">
            {isLoadingBalance ? '...' : parseFloat(availableBalance.replace(/,/g, '')).toFixed(3)} {availableSymbol}
          </span>
          <button
            type="button"
            className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#F06718]" />
          </button>
        </div>

        {/* Order Form Content */}
        <div className="flex-1">
          {activeTab === 'market' && (
            <ErrorBoundary>
              <MarketOrder
                buySell={buySell}
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
                buySell={buySell}
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
    </div>
  );
}

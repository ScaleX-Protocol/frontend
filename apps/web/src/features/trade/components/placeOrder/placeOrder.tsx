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
  const [activeTab, setActiveTab] = useState<'market' | 'limit' | 'swap'>('limit');
  const [selectedPrice] = useState<string>('');

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
    <div className="w-full h-full bg-[#0A0A0A] rounded-[16px] border border-[#1F1F1F] p-[21px] gap-[20px] flex flex-col overflow-hidden">
      <div className="flex p-1 gap-1 bg-[#111111] border border-[#222222] rounded-[8px]">
        <button
          type="button"
          className={`flex-1 py-1.5 text-center font-semibold text-xs leading-[16px] rounded transition-all ${
            buySell === 'buy' 
              ? 'bg-[#222222] text-white border border-[#333333]' 
              : 'text-[#666666] hover:text-[#E0E0E0]'
          }`}
          onClick={() => setBuySell('buy')}
        >
          Buy / Long
        </button>
        <button
          type="button"
          className={`flex-1 py-1.5 text-center font-semibold text-xs leading-[16px] rounded transition-all ${
            buySell === 'sell' 
              ? 'bg-[#222222] text-white border border-[#333333]' 
              : 'text-[#666666] hover:text-[#E0E0E0]'
          }`}
          onClick={() => setBuySell('sell')}
        >
          Sell / Short
        </button>
      </div>

      <div className='flex flex-row justify-between'>
        <div className="flex flex-row items-center gap-3">
          <button
            type="button"
            className={`pb-0.5 text-[10px] leading-[15px] relative transition-colors ${
              activeTab === 'limit' ? 'text-[#FFFFFF]' : 'text-[#555555] hover:text-[#FFFFFF]'
            }`}
            onClick={() => setActiveTab('limit')}
          >
            Limit
            {activeTab === 'limit' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFFFFF]" />
            )}
          </button>
          <button
            type="button"
            className={`pb-0.5 text-[10px] leading-[15px] relative transition-colors ${
              activeTab === 'market' ? 'text-[#FFFFFF]' : 'text-[#555555] hover:text-[#FFFFFF]'
            }`}
            onClick={() => setActiveTab('market')}
          >
            Market
            {activeTab === 'market' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFFFFF]" />
            )}
          </button>
          <button
            type="button"
            className={`pb-0.5 text-[10px] leading-[15px] relative transition-colors ${
              activeTab === 'swap' ? 'text-[#FFFFFF]' : 'text-[#555555] hover:text-[#FFFFFF]'
            }`}
            onClick={() => setActiveTab('swap')}
          >
            Stop
            {activeTab === 'swap' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFFFFF]" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#555555] text-[10px] leading-[15px]">Avail</span>
          <span className="text-[#FFFFFF] text-[10px] leading-[15px]">
            {isLoadingBalance ? '...' : parseFloat(availableBalance.replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {availableSymbol}
          </span>
        </div>
      </div>

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
            initialPrice={selectedPrice}
          />
        </ErrorBoundary>
      )}

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
  );
}

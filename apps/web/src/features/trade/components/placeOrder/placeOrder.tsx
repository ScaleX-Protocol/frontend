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
import Orders from '../orderBook/orders/orders';

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
  marketAddress?: string;
  variant?: 'desktop' | 'mobile';
  symbol?: string;
  onDataRefresh?: () => void;
}

export default function PlaceOrder({ baseToken, quoteToken, marketAddress, variant = 'desktop', symbol, onDataRefresh }: PlaceOrderProps) {
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

  // Use contract balances (includes yield) if available, otherwise fall back to indexer.
  // rawBalance is undefined when the query is disabled (e.g. Solana), so we use that
  // as the guard — avoids '0.00' (truthy) shadowing the indexer fallback.
  const balances = {
    baseCurrencyBalance: baseContractBalance.rawBalance !== undefined
      ? baseContractBalance.formattedString
      : indexerBalances.baseCurrencyBalance,
    quoteCurrencyBalance: quoteContractBalance.rawBalance !== undefined
      ? quoteContractBalance.formattedString
      : indexerBalances.quoteCurrencyBalance,
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



  // Common form content that's shared between variants
  const formContent = (
    <>
      {activeTab === 'limit' && (
        <ErrorBoundary>
          <LimitOrder
            buySell={buySell}
            baseBalance={balances.baseCurrencyBalance}
            quoteBalance={balances.quoteCurrencyBalance}
            isLoadingBalance={isLoadingBalance}
            baseToken={baseToken}
            quoteToken={quoteToken}
            marketAddress={marketAddress}
            onBalanceRefresh={handleRefreshBalance}
            onDataRefresh={onDataRefresh}
            initialPrice={selectedPrice}
            variant={variant}
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
            marketAddress={marketAddress}
            onBalanceRefresh={handleRefreshBalance}
            onDataRefresh={onDataRefresh}
            variant={variant}
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
            variant={variant}
          />
        </ErrorBoundary>
      )}
    </>
  );

  // Mobile variant: side-by-side layout with integrated OrderBook
  if (variant === 'mobile') {
    return (
      <div className="w-full flex flex-col gap-6 p-4">
        {/* Buy/Sell Toggle */}
        <div className="flex p-1 gap-1 bg-[#111111] border border-[#222222] rounded-[12px]">
          <button
            type="button"
            className={`flex-1 py-2.5 text-center font-semibold text-sm leading-[18px] rounded-[8px] transition-all ${
              buySell === 'buy' 
                ? 'bg-[#2ECC71]/10 text-[#2ECC71]' 
                : 'text-[#666666] hover:text-[#E0E0E0]'
            }`}
            onClick={() => setBuySell('buy')}
          >
            Buy
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-center font-semibold text-sm leading-[18px] rounded-[8px] transition-all ${
              buySell === 'sell' 
                ? 'bg-[#EF4444]/10 text-[#EF4444]' 
                : 'text-[#666666] hover:text-[#E0E0E0]'
            }`}
            onClick={() => setBuySell('sell')}
          >
            Sell
          </button>
        </div>

        <div className="flex gap-6">
          {/* Left: Place Order Form */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Limit/Market Tabs + Available Balance */}
            <div className="flex flex-row items-center gap-4 border-b border-[#222222]">
              <button
                type="button"
                className={`pb-1 text-sm leading-[20px] font-medium relative transition-colors ${
                  activeTab === 'limit' ? 'text-[#FFFFFF]' : 'text-[#666666] hover:text-[#FFFFFF]'
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
                className={`pb-1 text-sm leading-[20px] font-medium relative transition-colors ${
                  activeTab === 'market' ? 'text-[#FFFFFF]' : 'text-[#666666] hover:text-[#FFFFFF]'
                }`}
                onClick={() => setActiveTab('market')}
              >
                Market
                {activeTab === 'market' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFFFFF]" />
                )}
              </button>
            </div>

            {/* Available Balance Row */}
            <div className="flex items-center justify-between">
              <span className="text-[#666666] text-xs leading-[16px]">Available</span>
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-medium leading-[16px]">
                  {isLoadingBalance ? '...' : parseFloat(availableBalance.replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[#666666] text-xs font-medium leading-[16px]">{availableSymbol}</span>
                <button
                  type="button"
                  className="text-[#E26B1D] text-xs font-medium ml-1 hover:text-[#E26B1D]/70"
                  onClick={() => {
                    // Max button functionality will be handled by child components
                  }}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Form Content */}
            {formContent}
          </div>

          {/* Right: OrderBook */}
          {symbol && (
            <div className="w-[140px] shrink-0">
              <Orders symbol={symbol} variant="mobile" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop variant: original layout
  return (
    <div className="w-full h-full bg-[#0A0A0A] rounded-[16px] border border-[#404040] p-[21px] gap-[20px] flex flex-col overflow-hidden">
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
          Buy
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
          Sell
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
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#555555] text-[10px] leading-[15px]">Avail</span>
          <span className="text-[#FFFFFF] text-[10px] leading-[15px]">
            {isLoadingBalance ? '...' : parseFloat(availableBalance.replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {availableSymbol}
          </span>
        </div>
      </div>

      {formContent}
    </div>
  );
}

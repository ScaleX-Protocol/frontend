'use client';

import { useMemo, useState, useCallback } from 'react';
import { useWalletState } from '@/hooks/useWalletState';
import { ChainConfig } from '@/configs/chain';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/ui/useViewMode';
import { useLendingDashboard } from '@scalex/service-lending';
import type { AvailableToBorrow, LendingBorrow, LendingSummary, LendingSupply } from '@scalex/types';
import SummaryCard from './summary/summaryCard';
import AvailableToBorrowTable from './availToBorrow/availableToBorrowTable';
import EarningTable from './earn/earningTable';
import BorrowedTable from './borrow/borrowedTable';
import RepayModal from './modals/repayModal';
import { logger } from '@/utils/prodLogger';

export interface UseCurrenciesParams {
  chainId: number;
  onlyActual?: boolean;
  limit?: number;
}

export interface UseLendingDashboardParams {
  user: string;
  chainId?: number;
}

// Create contextual logger for Lending component
const log = logger.withContext({ component: 'Lending' });

// Content component that uses hooks - only rendered when Privy is ready
function LendingContent() {
  const wallet = useWalletState();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [repayOpen, setRepayOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets-to-borrow' | 'my-positions'>('assets-to-borrow');

  // Always use configured chainId from environment, not wallet's chainId
  const chainId = ChainConfig.defaultChainId;

  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    onlyActual: true,
    limit: 50,
  };

  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies(currenciesParams);

  const availableCurrencies = useMemo(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  // ALWAYS use embedded wallet for lending (ignore external wallet)
  const params: UseLendingDashboardParams = {
    user: wallet.embeddedWallet.address,
    chainId: chainId,
  };

  const { data, isLoading, error } = useLendingDashboard(params);

  // Refresh callback to refetch all lending-related data after transactions
  const handleDataRefresh = useCallback(() => {
    log.info('Lending data refresh requested after transaction', {
      userAddress: wallet.embeddedWallet.address,
      chainId,
    });

    // Invalidate lending dashboard query to trigger refetch after indexer sync
    if (wallet.embeddedWallet.address) {
      queryClient.invalidateQueries({
        queryKey: ['lendingDashboard', wallet.embeddedWallet.address, chainId]
      });

      log.info('Lending dashboard query invalidated, refetching data');
    }
  }, [queryClient, wallet.embeddedWallet.address, chainId]);

  if (isLoading) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-gray-400">No lending data available</div>
      </div>
    );
  }

  const supplies: LendingSupply[] = data.supplies;
  const borrows: LendingBorrow[] = data.borrows;
  const availableToBorrow: AvailableToBorrow[] = data.availableToBorrow || [];
  const summary: LendingSummary = data.summary;
  const interestRateParams = data.interestRateParams || [];

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="w-full flex-1 flex flex-col gap-6 p-5">
        {/* Summary Card at top */}
        <SummaryCard data={summary} loading={isLoading} error={error} variant="mobile" />
        
        {/* Tab Navigation */}
        <div className="flex flex-row gap-4 border-b border-[#222222]">
          <button
            type="button"
            onClick={() => setActiveTab('assets-to-borrow')}
            className={`pb-2 text-sm leading-[20px] font-medium transition-colors relative ${
              activeTab === 'assets-to-borrow'
                ? 'text-white'
                : 'text-[#666666]'
            }`}
          >
            Assets to Borrow
            {activeTab === 'assets-to-borrow' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-positions')}
            className={`pb-2 text-sm leading-[20px] font-medium transition-colors relative ${
              activeTab === 'my-positions'
                ? 'text-white'
                : 'text-[#666666]'
            }`}
          >
            My Positions
            {activeTab === 'my-positions' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'assets-to-borrow' && (
          <AvailableToBorrowTable
            data={availableToBorrow}
            chainId={chainId}
            interestRateParams={interestRateParams}
            summary={summary}
            variant="mobile"
            onDataRefresh={handleDataRefresh}
          />
        )}

        {activeTab === 'my-positions' && (
          <div className="flex flex-col gap-6 pb-[72px]">
            {/* Borrowed Assets Section */}
            <div className="flex flex-col gap-3">
              <span className="text-white text-base font-semibold">Borrowed Assets</span>
              <BorrowedTable
                data={borrows}
                isLoading={isLoading}
                error={error}
                onRepayClick={() => setRepayOpen(true)}
                variant="mobile"
              />
            </div>
            
            {/* Earning Assets Section */}
            <div className="flex flex-col gap-3">
              <span className="text-white text-base font-semibold">Earning Assets</span>
              <EarningTable 
                data={supplies} 
                isLoading={isLoading} 
                error={error} 
                variant="mobile"
              />
            </div>
          </div>
        )}

        <RepayModal
          isOpen={repayOpen}
          onClose={() => setRepayOpen(false)}
          currencies={availableCurrencies}
          currenciesLoading={currenciesLoading}
          onBalanceUpdate={handleDataRefresh}
          borrows={borrows}
          summary={summary}
        />
      </div>
    );
  }

  // Desktop Layout (Original)
  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-6 flex flex-col gap-6">
      {/* Top Row: Asset To Borrow + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <AvailableToBorrowTable
          data={availableToBorrow}
          chainId={chainId}
          interestRateParams={interestRateParams}
          summary={summary}
          onDataRefresh={handleDataRefresh}
        />
        <SummaryCard data={summary} loading={isLoading} error={error} variant="desktop" />
      </div>

      {/* Bottom Row: Borrowed Asset + Earning Asset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040]">
          <span className="text-[#E0E0E0] text-xl font-medium">Borrowed Asset</span>
          <BorrowedTable
            data={borrows}
            isLoading={isLoading}
            error={error}
            onRepayClick={() => setRepayOpen(true)}
          />
        </div>
        <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040]">
          <span className="text-[#E0E0E0] text-xl font-medium">Earning Asset</span>
          <EarningTable data={supplies} isLoading={isLoading} error={error} />
        </div>
      </div>

      <RepayModal
        isOpen={repayOpen}
        onClose={() => setRepayOpen(false)}
        currencies={availableCurrencies}
        currenciesLoading={currenciesLoading}
        onBalanceUpdate={handleDataRefresh}
        borrows={borrows}
        summary={summary}
      />
    </div>
  );
}

// Wrapper component - Privy ready check is now handled by ProvidersWithOnboarding
export default function Lending() {
  return <LendingContent />;
}


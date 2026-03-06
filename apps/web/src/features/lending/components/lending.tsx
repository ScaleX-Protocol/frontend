'use client';

import { useMemo, useState, useCallback } from 'react';
import { MoreHorizontal } from 'lucide-react';
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
import { InfoPopover } from '@/components/ui/info-popover';

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

  const supplies: LendingSupply[] = data?.supplies || [];
  const borrows: LendingBorrow[] = data?.borrows || [];
  const availableToBorrow: AvailableToBorrow[] = data?.availableToBorrow || [];
  const summary: LendingSummary = data?.summary || {
    totalSupplied: '0',
    totalBorrowed: '0',
    netAPY: '0',
    totalEarnings: '0',
    healthFactor: '999999',
    borrowingPower: '0'
  };
  const interestRateParams = data?.interestRateParams || [];

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
            className={`pb-2 text-sm leading-[20px] font-medium transition-colors relative ${activeTab === 'assets-to-borrow'
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
            className={`pb-2 text-sm leading-[20px] font-medium transition-colors relative ${activeTab === 'my-positions'
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
    <div className="w-full flex-1 p-8 flex flex-col gap-6">
      {/* Top Row: Asset To Borrow + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <AvailableToBorrowTable
          data={availableToBorrow}
          chainId={chainId}
          interestRateParams={interestRateParams}
          summary={summary}
          isLoading={isLoading}
          error={error}
          onDataRefresh={handleDataRefresh}
        />
        <SummaryCard data={summary} loading={isLoading} error={error} variant="desktop" />
      </div>

      {/* Bottom Row: Borrowed Asset + Earning Asset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Borrowed / My Debt */}
        <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
            <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold flex items-center gap-2">
              Borrowed <InfoPopover content="Assets you've borrowed against your collateral. Monitor borrow APY and repay to improve your health factor." />
            </span>
            <button
              type="button"
              className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
          <BorrowedTable
            data={borrows}
            isLoading={isLoading}
            error={error}
            onRepayClick={() => setRepayOpen(true)}
          />
        </div>
        {/* Earning / My Supply */}
        <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
            <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold flex items-center gap-2">
              Earning <InfoPopover content="Assets you've supplied to earn yield. Your deposits earn interest from borrowers automatically." />
            </span>
            <button
              type="button"
              className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
          <EarningTable data={supplies} isLoading={isLoading} error={error} variant="desktop" />
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


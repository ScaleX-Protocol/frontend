'use client';

import { MoreHorizontal } from 'lucide-react';
import BalanceCard from './shared/BalanceCard';
import SummaryCard from './shared/SummaryCard';
import PortfolioTable from './tables/portfolioTable';
import EarnTable from './tables/earnTable';
import BorrowTable from './tables/borrowTable';
import type { LendingDashboard } from '@scalex/types';

interface OverviewDesktopProps {
  lendingData: LendingDashboard | undefined;
  isLoading: boolean;
  error: Error | null;
  refetchLendingData: () => void;
  currencies: any[];
  currenciesLoading: boolean;
  timePeriod: string;
  onTimePeriodChange: (period: '24h' | 'Week' | 'Month') => void;
}

export default function OverviewDesktop({
  lendingData,
  isLoading,
  error,
  refetchLendingData,
  currencies,
  currenciesLoading,
  timePeriod,
  onTimePeriodChange,
}: OverviewDesktopProps) {
  const balance = lendingData?.summary 
    ? `$${parseFloat(lendingData.summary.totalSupplied).toLocaleString()}` 
    : '-';

  return (
    <div className="w-full flex-1 p-5 md:p-8 flex flex-col gap-6">
      {/* Header Section with Title and Time Period Filter */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-semibold text-2xl leading-[32px] text-[#FFFFFF]">Overview</span>
          <span className="text-[#666666] text-sm leading-[20px]">
            Manage your assets and track your performance.
          </span>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center bg-[#111111] rounded-full p-1 gap-2 border border-[#222222]">
          {(['24h', 'Week', 'Month'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onTimePeriodChange(period)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                timePeriod === period
                  ? 'bg-[#222222] text-[#FFFFFF]'
                  : 'text-[#666666] hover:text-[#A0A0A0]'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Balance and Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <BalanceCard
            balance={balance}
            refetch={refetchLendingData}
            currencies={currencies}
            currenciesLoading={currenciesLoading}
          />
        </div>
        <div className="col-span-1">
          <SummaryCard data={lendingData?.summary} loading={isLoading} error={error} />
        </div>
      </div>

      {/* Asset Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Portfolio Assets */}
        <div className="bg-[#161616] rounded-[32px] flex flex-col border border-[#404040]">
          <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
            <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">
              Portfolio Assets
            </span>
            <button
              type="button"
              className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
          <PortfolioTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
        </div>

        {/* Earning Assets */}
        <div className="bg-[#161616] rounded-[32px] flex flex-col border border-[#404040]">
          <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
            <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">
              Earning Assets
            </span>
            <button
              type="button"
              className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
          <EarnTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
        </div>

        {/* Borrow Assets */}
        <div className="bg-[#161616] rounded-[32px] flex flex-col border border-[#404040]">
          <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
            <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">
              Borrow Assets
            </span>
            <button
              type="button"
              className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
          <BorrowTable data={lendingData?.borrows || []} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}

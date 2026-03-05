'use client';

import { MoreHorizontal } from 'lucide-react';
import BalanceCard from './shared/BalanceCard';
import SummaryCard from './shared/SummaryCard';
import PortfolioTable from './tables/portfolioTable';
import EarnTable from './tables/earnTable';
import BorrowTable from './tables/borrowTable';
import type { LendingDashboard } from '@scalex/types';
import { deriveLendingSummary } from '@/features/lending/utils/lending.helper';

interface OverviewMobileProps {
  lendingData: LendingDashboard | undefined;
  isLoading: boolean;
  error: Error | null;
  refetchLendingData: () => void;
  currencies: unknown[];
  currenciesLoading: boolean;
}

export default function OverviewMobile({
  lendingData,
  isLoading,
  error,
  refetchLendingData,
  currencies,
  currenciesLoading,
}: OverviewMobileProps) {
  // Solana indexer omits `summary` — derive it from supplies/borrows when absent
  const summary = lendingData
    ? (lendingData.summary ?? deriveLendingSummary({
        supplies: lendingData.supplies,
        borrows: lendingData.borrows,
        availableToBorrow: lendingData.availableToBorrow,
      }))
    : undefined;

  const balance = summary
    ? `$${parseFloat(summary.totalSupplied).toLocaleString()}`
    : '-';

  return (
    <div className="w-full flex-1 p-5 flex flex-col gap-4">
      {/* Balance Card */}
      <BalanceCard
        balance={balance}
        refetch={refetchLendingData}
        currencies={currencies}
        currenciesLoading={currenciesLoading}
      />

      {/* Market Overview - using SummaryCard with mobile variant */}
      <SummaryCard data={summary} loading={isLoading} variant="mobile" />

      {/* Portfolio Assets */}
      <div className="bg-[#161616] rounded-[24px] flex flex-col border border-[#404040]">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[14px] leading-[20px] font-semibold">
            Portfolio Assets
          </span>
          <button
            type="button"
            className="bg-[#161616] p-1.5 w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
        <PortfolioTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
      </div>

      {/* Earning Assets */}
      <div className="bg-[#161616] rounded-[24px] flex flex-col border border-[#404040]">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[14px] leading-[20px] font-semibold">
            Earning Assets
          </span>
          <button
            type="button"
            className="bg-[#161616] p-1.5 w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
        <EarnTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
      </div>

      {/* Borrow Assets */}
      <div className="bg-[#161616] rounded-[24px] flex flex-col border border-[#404040]">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[14px] leading-[20px] font-semibold">
            Borrow Assets
          </span>
          <button
            type="button"
            className="bg-[#161616] p-1.5 w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
        <BorrowTable data={lendingData?.borrows || []} isLoading={isLoading} error={error} />
      </div>

      {/* Version Footer */}
      <div className="flex justify-center items-center py-4">
        <span className="text-[#666666] text-xs">
          v{import.meta.env.VITE_APP_VERSION || '1.0.1'} • Base Sepolia (Chain ID: 84532)
        </span>
      </div>
    </div>
  );
}


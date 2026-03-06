"use client";

import { MoreHorizontal } from "lucide-react";
import BalanceCard from "@/features/overview/components/shared/BalanceCard";
import SummaryCard from "@/features/overview/components/shared/SummaryCard";
import PortfolioTable from "@/features/overview/components/tables/portfolioTable";
import EarnTable from "@/features/overview/components/tables/earnTable";
import BorrowTable from "@/features/overview/components/tables/borrowTable";
import type { LendingDashboard } from "@scalex/types";
import ActivityFeed from "./activity/ActivityFeed";

interface PortfolioMobileProps {
  lendingData: LendingDashboard | undefined;
  isLoading: boolean;
  error: Error | null;
  refetchLendingData: () => void;
  currencies: unknown[];
  currenciesLoading: boolean;
}

export default function PortfolioMobile({
  lendingData,
  isLoading,
  error,
  refetchLendingData,
  currencies,
  currenciesLoading,
}: PortfolioMobileProps) {
  const balance = lendingData?.summary
    ? `$${parseFloat(lendingData.summary.totalSupplied).toLocaleString()}`
    : "-";

  return (
    <div className="w-full flex-1 p-5 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col">
        <span className="font-semibold text-xl leading-[28px] text-[#FFFFFF]">
          Portfolio
        </span>
        <span className="text-[#666666] text-sm leading-[20px]">
          Manage your assets and track your performance.
        </span>
      </div>

      {/* Balance Card */}
      <BalanceCard
        balance={balance}
        refetch={refetchLendingData}
        currencies={currencies}
        currenciesLoading={currenciesLoading}
      />

      {/* Market Overview - using SummaryCard with mobile variant */}
      <SummaryCard
        data={lendingData?.summary}
        loading={isLoading}
        variant="mobile"
      />

      <div className="flex flex-col gap-4">
        {/* Portfolio Assets */}
        <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F]">
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
          <PortfolioTable
            data={lendingData?.supplies || []}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Earning Assets */}
        <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F]">
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
          <EarnTable
            data={lendingData?.supplies || []}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Borrow Assets */}
        <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F]">
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
          <BorrowTable
            data={lendingData?.borrows || []}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Activity History */}
        <div className="bg-[#0C0C0C] rounded-[24px] flex flex-col border border-[#1F1F1F]">
          <div className="p-4 border-b border-[#1F1F1F]">
            <span className="text-[#FFFFFF] text-[14px] leading-[20px] font-semibold">
              Activity History
            </span>
          </div>
          <div className="p-4">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}

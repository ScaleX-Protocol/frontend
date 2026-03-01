import { ArrowDownLeft, Zap } from 'lucide-react';
import type { LendingBorrow } from '@/features/lending/types/lending.types';
import { TokenIcon } from '@/components/common/TokenIcon';

interface BorrowedTableProps {
  data: LendingBorrow[];
  isLoading: boolean;
  error: Error | null;
  onRepayClick: () => void;
  variant?: 'desktop' | 'mobile';
}

// Reusable Table Header component
function TableHeader() {
  return (
    <div className="flex flex-row px-6 py-3 bg-[#111111]/50 border-b border-[#1F1F1F] min-w-fit">
      <div className="w-24 shrink-0 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-left">Asset</div>
      <div className="w-24 shrink-0 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">Amount</div>
      <div className="flex-1 min-w-[100px] text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">Accrued Interest</div>
      <div className="w-16 shrink-0 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">APY</div>
      <div className="w-36 shrink-0 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">Actions</div>
    </div>
  );
}

export default function BorrowedTable({
  data,
  isLoading,
  error,
  onRepayClick,
  variant = 'desktop'
}: BorrowedTableProps) {

  // Mobile Variant
  if (variant === 'mobile') {
    // Mobile loading state
    if (isLoading) {
      return (
        <div className="bg-[#1A1A1A] rounded-[16px] p-6 flex items-center justify-center border border-[#222222]">
          <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
        </div>
      );
    }

    // Mobile error state
    if (error) {
      return (
        <div className="bg-[#1A1A1A] rounded-[16px] p-6 flex flex-col items-center gap-3 border border-[#222222]">
          <span className="text-red-400 text-sm">Failed to load borrowed assets</span>
        </div>
      );
    }

    // Mobile empty state
    if (data.length === 0) {
      return (
        <div className="bg-[#1A1A1A] rounded-[16px] p-6 flex flex-col items-center gap-4 border border-[#222222]">
          {/* Icon with orange border */}
          <div className="w-14 h-14 rounded-[12px] border-2 border-[#E26B1D] flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6 text-[#E26B1D]" />
          </div>

          {/* Text content */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-white font-semibold text-base">Unlock Instant Liquidity</span>
            <span className="text-[#666666] text-sm">Access capital without selling your crypto.</span>
          </div>

          {/* Orange gradient button */}
          <button
            type="button"
            onClick={onRepayClick}
            className="w-full py-3 rounded-full bg-[#E26B1D] hover:bg-[#F07830] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Borrow Now
          </button>
        </div>
      );
    }

    // Mobile data state (cards)
    return (
      <div className="flex flex-col gap-3">
        {data.map((asset) => (
          <div
            key={asset.id}
            className="bg-[#1A1A1A] rounded-[16px] p-4 flex flex-col gap-3 border border-[#222222]"
          >
            {/* Asset header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TokenIcon symbol={asset.asset} />
                <span className="text-white font-semibold">{asset.asset}</span>
              </div>
              <span className="text-[#F06718] font-semibold">{asset.apy}</span>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#666666]">Amount</span>
                <span className="text-white">{asset.currentDebt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Interest</span>
                <span className="text-red-400">{asset.accruedInterest?.amount || '0.00'}</span>
              </div>
            </div>

            {/* Repay button */}
            <button
              type="button"
              onClick={onRepayClick}
              className="w-full py-2.5 bg-[#F06718] hover:bg-[#D85A14] text-white text-sm font-semibold rounded-full"
            >
              Repay
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Desktop Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="overflow-x-auto">
          <TableHeader />
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
          <span className="text-[#A0A0A0] text-sm font-dm-sans">Loading borrowed assets...</span>
        </div>
      </div>
    );
  }

  // Desktop Error state
  if (error) {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="overflow-x-auto">
          <TableHeader />
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[#E0E0E0] font-medium">Failed to load data</span>
          <span className="text-[#666666] text-sm font-dm-sans">{error.message}</span>
        </div>
      </div>
    );
  }

  // Desktop Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="overflow-x-auto">
          <TableHeader />
        </div>
        <div className="flex flex-col items-center justify-center py-6 gap-[14px]">
          <div className="w-14 h-14 flex items-center justify-center bg-[#111111]/10 rounded-2xl">
            <ArrowDownLeft className="w-6 h-6 text-[#444444]" />
          </div>
          <div className="flex flex-col items-center gap-[6px]">
            <span className="text-[#E0E0E0] font-medium">Unlock Instant Liquidity</span>
            <span className="text-[#666666] text-sm font-dm-sans">Access capital without selling your crypto.</span>
          </div>
          <button
            type="button"
            className="px-6 py-2 bg-[#161616] hover:bg-[#2A2A2A] text-[#E0E0E0] border-[#333333] border text-sm font-medium rounded-full transition-colors"
          >
            Borrow Now
          </button>
        </div>
      </div>
    );
  }

  // Desktop Data state
  return (
    <div className="flex flex-col w-full h-full">
      <div className="overflow-x-auto">
        <TableHeader />
        {/* Data rows */}
        <div className="flex flex-col min-w-fit">
          {data.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-row items-center hover:bg-[#141414] transition-colors border-t border-[#1F1F1F]"
            >
              {/* Asset */}
              <div className="w-24 shrink-0 px-3 py-3">
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={asset.asset} />
                  <span className="text-[#E0E0E0] font-dm-sans text-sm">{asset.asset}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="w-24 shrink-0 px-3 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center">
                {asset.currentDebt}
              </div>

              {/* Accrued Interest */}
              <div className="flex-1 min-w-[100px] px-3 py-3 text-center">
                <div className="text-red-400 font-medium font-dm-sans text-sm">
                  {asset.accruedInterest?.amount || '0.00'} {asset.asset}
                </div>
                <div className="text-[#666666] text-xs font-dm-sans">
                  {asset.accruedInterest?.duration || '0d 0h'}
                </div>
              </div>

              {/* APY */}
              <div className="w-16 shrink-0 px-3 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center">
                {asset.apy}
              </div>

              {/* Actions */}
              <div className="w-36 shrink-0 px-3 py-3 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={onRepayClick}
                  className="px-3 py-1.5 bg-[#F06718] hover:bg-[#D85A14] text-white text-xs font-medium rounded-md transition-colors"
                >
                  Repay
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white text-xs rounded-md transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


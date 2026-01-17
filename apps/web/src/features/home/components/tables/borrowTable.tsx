import { ArrowDownLeft } from 'lucide-react';
import type { LendingBorrow } from '@/features/lending/types/lending.types';
import { TokenIcon } from '@/components/common/TokenIcon';

interface BorrowTableProps {
  data: LendingBorrow[];
  isLoading: boolean;
  error: Error | null;
  onBorrowNow?: () => void;
}

export default function BorrowTable({ data, isLoading, error, onBorrowNow }: BorrowTableProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row px-6 py-3 bg-[#111111]/50 border-b border-[#1F1F1F]">
          <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide">ASSET</div>
          <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">AMOUNT</div>
          <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-right">APY</div>
        </div>
        {/* Loading content */}
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
          <span className="text-[#A0A0A0] text-sm font-dm-sans">Loading borrow assets...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row px-6 py-3 bg-[#111111]/50 border-b border-[#1F1F1F]">
          <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide">ASSET</div>
          <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">AMOUNT</div>
          <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-right">APY</div>
        </div>
        {/* Error content */}
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

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row px-6 py-3 bg-[#111111]/50 border-b border-[#1F1F1F]">
          <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide">ASSET</div>
          <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">AMOUNT</div>
          <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-right">APY</div>
        </div>
        {/* Empty content */}
        <div className="flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-14 h-14 flex items-center justify-center bg-[#111111] rounded-[16px] border border-[#222222]">
            <ArrowDownLeft className="w-6 h-6 text-[#444444]" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[#FFFFFF] font-medium text-sm leading-[20px]">Unlock Instant Liquidity</span>
            <span className="text-[#666666] text-xs text-center leading-[19.5px] max-w-[167px]">Access capital without selling your crypto.</span>
          </div>
          <button 
            onClick={onBorrowNow}
            className="px-4 py-2 bg-[#161616] hover:bg-[#1A1A1A] text-[#E0E0E0] border border-[#333333] text-xs leading-[16px] font-medium rounded-full transition-colors"
          >
            Borrow Now
          </button>
        </div>
      </div>
    );
  }

  // Data state
  return (
    <div className="flex flex-col rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex flex-row px-6 py-3 bg-[#111111]/50 border-b border-[#1F1F1F]">
        <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide">ASSET</div>
        <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-center">AMOUNT</div>
        <div className="flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide text-right">APY</div>
      </div>
      {/* Data rows */}
      <div className="flex flex-col">
        {data.map((asset) => (
          <div 
            key={asset.id} 
            className="flex flex-row items-center hover:bg-[#2A2A2A] transition-colors"
          >
            <div className="flex-1 px-4 py-3">
              <div className="flex items-center gap-2">
                <TokenIcon symbol={asset.asset} />
                <span className="text-[#E0E0E0] font-dm-sans">{asset.asset}</span>
              </div>
            </div>
            <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-center">
              {asset.borrowedAmount} {asset.asset}
            </div>
            <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-right">
              {asset.apy}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

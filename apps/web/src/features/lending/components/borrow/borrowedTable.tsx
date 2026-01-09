import { ArrowDownLeft } from 'lucide-react';
import type { LendingBorrow } from '@/features/lending/types/lending.types';
import { TokenIcon } from '../tokenIcon';

interface BorrowedTableProps {
  data: LendingBorrow[];
  isLoading: boolean;
  error: Error | null;
  onRepayClick: () => void;
}

// Reusable Table Header component
function TableHeader() {
  return (
    <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838] min-w-fit">
      <div className="w-24 shrink-0 px-3 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
      <div className="w-24 shrink-0 px-3 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Amount</div>
      <div className="flex-1 min-w-[100px] px-3 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Accrued Interest</div>
      <div className="w-16 shrink-0 px-3 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">APY</div>
      <div className="w-36 shrink-0 px-3 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center">Actions</div>
    </div>
  );
}

export default function BorrowedTable({ data, isLoading, error, onRepayClick }: BorrowedTableProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
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

  // Error state
  if (error) {
    return (
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
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

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
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

  // Data state
  return (
    <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <TableHeader />
        {/* Data rows */}
        <div className="flex flex-col min-w-fit">
          {data.map((asset) => (
            <div 
              key={asset.id} 
              className="flex flex-row items-center hover:bg-[#2A2A2A] transition-colors border-t border-[#383838]"
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

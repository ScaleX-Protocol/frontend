import { TrendingUp, Zap } from 'lucide-react';
import type { LendingSupply } from '@/features/lending/types/lending.types';
import { TokenIcon } from '@/components/common/TokenIcon';

interface EarningTableProps {
  data: LendingSupply[];
  isLoading: boolean;
  error: Error | null;
  onAddAssets?: () => void;
  variant?: 'desktop' | 'mobile';
}

export default function EarningTable({ 
  data, 
  isLoading, 
  error, 
  onAddAssets,
  variant = 'desktop' 
}: EarningTableProps) {
  
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
          <span className="text-red-400 text-sm">Failed to load earning assets</span>
        </div>
      );
    }

    // Mobile empty state
    if (data.length === 0) {
      return (
        <div className="bg-[#1A1A1A] rounded-[16px] p-6 flex flex-col items-center gap-4 border border-[#222222]">
          {/* Icon with orange rings */}
          <div className="w-14 h-14 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="16" stroke="#E26B1D" strokeWidth="2" strokeDasharray="4 4"/>
              <circle cx="24" cy="24" r="10" stroke="#E26B1D" strokeWidth="2"/>
              <circle cx="24" cy="24" r="4" fill="#E26B1D"/>
            </svg>
          </div>
          
          {/* Text content */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-white font-semibold text-base">Ready to Earn?</span>
            <span className="text-[#666666] text-sm">Your idle assets could be growing.</span>
          </div>
          
          {/* Orange gradient button */}
          <button
            type="button"
            onClick={onAddAssets}
            className="w-full py-3 rounded-full bg-[#E26B1D] hover:bg-[#F07830] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Start Earning
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
              <span className="text-[#2ECC71] font-semibold">{asset.apy}</span>
            </div>
            
            {/* Details */}
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#666666]">Balance</span>
                <span className="text-white">{asset.currentValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Yield</span>
                <span className="text-[#2ECC71]">{asset.accruedYield?.amount || '0.00'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838]">
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Balance</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Accrued Yield</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-right">APY</div>
        </div>
        {/* Loading content */}
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
          <span className="text-[#A0A0A0] text-sm font-dm-sans">Loading earning assets...</span>
        </div>
      </div>
    );
  }

  // Desktop Error state
  if (error) {
    return (
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838]">
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Balance</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Accrued Yield</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-right">APY</div>
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

  // Desktop Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838]">
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Balance</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Accrued Yield</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-right">APY</div>
        </div>
        {/* Empty content */}
        <div className="flex flex-col items-center justify-center py-6 gap-[14px]">
          <div className="w-14 h-14 flex items-center justify-center bg-[#111111]/10 rounded-2xl">
            <TrendingUp className="w-6 h-6 text-[#444444]" />
          </div>
          <div className="flex flex-col items-center gap-[6px]">
            <span className="text-[#E0E0E0] font-medium">Ready to Earn?</span>
            <span className="text-[#666666] text-sm font-dm-sans">Your idle assets could be growing.</span>
          </div>
          <button 
            type="button"
            onClick={onAddAssets}
            className="px-6 py-2 bg-[#161616] hover:bg-[#2A2A2A] text-[#E0E0E0] border-[#333333] border text-sm font-medium rounded-full transition-colors"
          >
            Add Assets
          </button>
        </div>
      </div>
    );
  }

  // Desktop Data state
  return (
    <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838]">
        <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
        <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Balance</div>
        <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Accrued Yield</div>
        <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-right">APY</div>
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
              {asset.currentValue}
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <div className="text-green-400 font-medium font-dm-sans">{asset.accruedYield?.amount || '0.00'} {asset.asset}</div>
              <div className="text-[#666666] text-xs font-dm-sans">{asset.accruedYield?.duration || '0d 0h'}</div>
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


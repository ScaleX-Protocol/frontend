import { Wallet } from 'lucide-react';
import type { LendingSupply } from '@/features/lending/types/lending.types';
import { TokenIcon } from '../tokenIcon';

interface PortfolioTableProps {
  data: LendingSupply[];
  isLoading: boolean;
  error: Error | null;
  onAddAssets?: () => void;
}

export default function PortfolioTable({ data, isLoading, error, onAddAssets }: PortfolioTableProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838]">
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Balance</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-right">APY</div>
        </div>
        {/* Loading content */}
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
          <span className="text-[#A0A0A0] text-sm font-dm-sans">Loading portfolio assets...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838]">
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Balance</div>
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

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838]">
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Balance</div>
          <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-right">APY</div>
        </div>
        {/* Empty content */}
        <div className="flex flex-col items-center justify-center py-6 gap-[14px]">
          <div className="w-14 h-14 flex items-center justify-center bg-[#111111]/10 rounded-2xl">
            <Wallet className="w-6 h-6 text-[#444444]" />
          </div>
          <div className="flex flex-col items-center gap-[6px]">
            <span className="text-[#E0E0E0] font-medium">Start Your Portfolio</span>
            <span className="text-[#666666] text-sm font-dm-sans">Deposit assets to begin managing your wealth.</span>
          </div>
          <button 
            onClick={onAddAssets}
            className="px-6 py-2 bg-[#161616] hover:bg-[#2A2A2A] text-[#E0E0E0] border-[#333333] border text-sm font-medium rounded-full transition-colors"
          >
            Add Assets
          </button>
        </div>
      </div>
    );
  }

  // Data state
  return (
    <div className="flex flex-col border border-[#383838] rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex flex-row bg-[#3C3C3C] border-b border-[#383838]">
        <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm border-r border-[#383838]">Asset</div>
        <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-sm text-center border-r border-[#383838]">Balance</div>
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
                <TokenIcon symbol={`gs${asset.asset}`} />
                <span className="text-[#E0E0E0] font-dm-sans">{asset.asset}</span>
              </div>
            </div>
            <div className="flex-1 px-4 py-3 text-[#E0E0E0] font-dm-sans text-center">
              {asset.suppliedAmount} {asset.asset}
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

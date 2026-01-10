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
      <div className="flex flex-col border border-[#1A1A1A] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex flex-row bg-[#141414] border-b border-[#1A1A1A]">
          <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide border-r border-[#1A1A1A]">ASSET</div>
          <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide text-center border-r border-[#1A1A1A]">BALANCE</div>
          <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide text-right">APY</div>
        </div>
        {/* Loading content */}
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-6 h-6 border-2 border-[#252525] border-t-[#606060] rounded-full animate-spin" />
          <span className="text-[#505050] text-sm">Loading portfolio assets...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col border border-[#1A1A1A] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex flex-row bg-[#141414] border-b border-[#1A1A1A]">
          <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide border-r border-[#1A1A1A]">ASSET</div>
          <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide text-center border-r border-[#1A1A1A]">BALANCE</div>
          <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide text-right">APY</div>
        </div>
        {/* Error content */}
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[#E0E0E0] font-medium text-sm">Failed to load data</span>
          <span className="text-[#404040] text-xs">{error.message}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col border border-[#1A1A1A] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex flex-row bg-[#141414] border-b border-[#1A1A1A]">
          <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide border-r border-[#1A1A1A]">ASSET</div>
          <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide text-center border-r border-[#1A1A1A]">BALANCE</div>
          <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide text-right">APY</div>
        </div>
        {/* Empty content */}
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-12 h-12 flex items-center justify-center bg-[#141414] rounded-2xl border border-[#1F1F1F]">
            <Wallet className="w-5 h-5 text-[#404040]" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#E0E0E0] font-medium text-sm">Start Your Portfolio</span>
            <span className="text-[#404040] text-xs text-center">Deposit assets to begin managing your wealth.</span>
          </div>
          <button
            onClick={onAddAssets}
            className="px-5 py-2 bg-[#141414] hover:bg-[#1A1A1A] text-[#E0E0E0] border border-[#252525] text-xs font-medium rounded-full transition-colors"
          >
            Add Assets
          </button>
        </div>
      </div>
    );
  }

  // Data state
  return (
    <div className="flex flex-col border border-[#1A1A1A] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex flex-row bg-[#141414] border-b border-[#1A1A1A]">
        <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide border-r border-[#1A1A1A]">ASSET</div>
        <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide text-center border-r border-[#1A1A1A]">BALANCE</div>
        <div className="flex-1 px-4 py-2.5 text-[#505050] text-xs uppercase tracking-wide text-right">APY</div>
      </div>
      {/* Data rows */}
      <div className="flex flex-col">
        {data.map((asset) => (
          <div
            key={asset.id}
            className="flex flex-row items-center hover:bg-[#141414] transition-colors"
          >
            <div className="flex-1 px-4 py-3">
              <div className="flex items-center gap-2">
                <TokenIcon symbol={`gs${asset.asset}`} />
                <span className="text-[#E0E0E0] text-sm">{asset.asset}</span>
              </div>
            </div>
            <div className="flex-1 px-4 py-3 text-[#E0E0E0] text-sm text-center">
              {asset.suppliedAmount} {asset.asset}
            </div>
            <div className="flex-1 px-4 py-3 text-[#E0E0E0] text-sm text-right">
              {asset.apy}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


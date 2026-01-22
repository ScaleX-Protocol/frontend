import { LendingSupply } from '../../types/lending.types';
import { TokenIcon } from '@/components/common/TokenIcon';
import { TrendingUp } from 'lucide-react';

export default function EarningTable({ data, isLoading, error }: { data: LendingSupply[], isLoading: boolean; error: Error | null }) {
  return (
    <div className="border border-[#3A3A3A] rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-[#3A3A3A]">
        <div className="grid grid-cols-4 px-4 py-2">
          <span className="text-xs font-medium text-[#E0E0E0] uppercase tracking-wider">Asset</span>
          <span className="text-xs font-medium text-[#E0E0E0] uppercase tracking-wider text-center">Balance</span>
          <span className="text-xs font-medium text-[#E0E0E0] uppercase tracking-wider text-center">Accrued Yield</span>
          <span className="text-xs font-medium text-[#E0E0E0] uppercase tracking-wider text-right">APY</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-[#2C2C2C]">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
              <span className="text-[#E0E0E0]/70">Loading earning assets...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Failed to load data</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 font-medium">Failed to load data</span>
              <span className="text-[#E0E0E0]/60 text-sm">{error.message}</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          // Empty State - "Ready to Earn?"
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <TrendingUp className="w-10 h-10 text-[#E0E0E0]/30" />
              <div>
                <p className="text-[#E0E0E0] font-medium">Ready to Earn?</p>
                <p className="text-[#A0A0A0] text-sm">Your idle assets could be growing.</p>
              </div>
              <button
                type="button"
                className="mt-2 px-6 py-2 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-[#E0E0E0] text-sm rounded-full border border-[#4A4A4A] transition-colors"
              >
                Add Assets
              </button>
            </div>
          </div>
        ) : (
          data.map((asset) => (
            <div key={asset.id} className="grid grid-cols-4 px-4 py-3 items-center border-t border-[#3A3A3A] first:border-t-0 hover:bg-[#363636] transition-colors">
              <div className="flex items-center gap-2">
                <TokenIcon symbol={`gs${asset.asset}`} />
                <span className="text-[#E0E0E0]">{asset.asset}</span>
              </div>
              <div className="text-[#E0E0E0] text-center">{asset.currentValue}</div>
              <div className="text-center">
                <div className="text-green-400 font-medium">{asset.accruedYield?.amount || '0.00'} {asset.asset}</div>
                <div className="text-[#E0E0E0]/60 text-xs">{asset.accruedYield?.duration || '0d 0h'}</div>
              </div>
              <div className="text-[#E0E0E0] text-right">{asset.apy}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

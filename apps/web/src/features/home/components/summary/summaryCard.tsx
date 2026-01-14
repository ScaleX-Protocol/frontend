import { AlertCircle, RefreshCcw, Info, Activity } from 'lucide-react';
import type { LendingSummary } from '@/features/lending/types/lending.types';
import CountUp from './countUp';

interface SummaryCardProps {
  data?: LendingSummary;
  loading?: boolean;
  error?: Error | null;
}

export default function SummaryCard({ data, loading = false, error = null }: SummaryCardProps) {
  const getHealthFactorColor = (hf: string) => {
    const num = parseFloat(hf);
    if (num < 1.5) return 'text-red-500';
    if (num < 2.0) return 'text-yellow-500';
    return 'text-[#22C55E]';
  };

  const isInfinity = (hf: string) => {
    const num = parseFloat(hf);
    return num > 999;
  };

  if (loading) {
    return (
      <div className="bg-[#0F0F0F] rounded-[20px] p-5 h-full flex flex-col gap-4 border border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <span className="text-[#E0E0E0] text-lg font-medium">Account Summary</span>
          <button type="button" className="text-[#505050]">
            <RefreshCcw size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[#606060] text-sm">Net APY</span>
            <span className="text-[#22C55E] text-sm font-medium">0.00%</span>
          </div>
          <div className="w-full h-px bg-[#1A1A1A]" />

          <div className="flex justify-between items-center">
            <span className="text-[#606060] text-sm">Health Factor</span>
            <span className="text-[#22C55E] text-sm font-medium">∞</span>
          </div>
          <div className="w-full h-px bg-[#1A1A1A]" />

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[#505050] text-xs uppercase">SUPPLIED</span>
              <span className="text-[#E0E0E0] text-sm">$0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#505050] text-xs uppercase">BORROWED</span>
              <span className="text-[#E0E0E0] text-sm">$0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#505050] text-xs uppercase">EARNING</span>
              <span className="text-[#E0E0E0] text-sm">$0.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#505050] text-xs uppercase">POWER</span>
              <span className="text-[#E0E0E0] text-sm">$0.00</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0F0F0F] rounded-[20px] p-5 h-full flex flex-col gap-4 border border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <span className="text-[#E0E0E0] text-lg font-medium">Account Summary</span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-[#606060] text-sm text-center">Failed to load summary</span>
          <span className="text-[#404040] text-xs text-center">Please try again later</span>
        </div>
      </div>
    );
  }

  const summary = data || {
    totalSupplied: '0',
    totalBorrowed: '0',
    netAPY: '0',
    totalEarnings: '0',
    healthFactor: '999999',
    borrowingPower: '0'
  };

  return (
    <div className="bg-[#161616] rounded-[32px] p-8 h-full flex flex-col border border-[#404040]">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[#FFFFFF] text-lg leading-[28px] font-semibold">Account Summary</span>
        <button type="button" className="w-8 h-8 rounded-full bg-[#161616] border border-[#222222] flex items-center justify-center text-[#888888] hover:text-[#FFFFFF] hover:bg-[#222222] transition-colors">
          <Activity size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Net APY */}
        <div className="flex justify-between items-center">
          <span className="text-[#888888] text-sm leading-[20px]">Net APY</span>
          <CountUp
            end={parseFloat(summary.netAPY)}
            decimals={2}
            suffix="%"
            className="text-[#2ECC71] text-[16px] leading-[24px] font-medium"
          />
        </div>
        <div className="w-full h-px bg-[#1F1F1F]" />

        {/* Health Factor */}
        <div className="flex justify-between items-center">
          <span className="text-[#888888] text-sm leading-[20px]">Health Factor</span>
          <div className="flex items-center gap-2">
            {isInfinity(summary.healthFactor) ? (
              <span className={`text-sm font-medium ${getHealthFactorColor(summary.healthFactor)}`}>
                ∞
              </span>
            ) : (
              <CountUp
                end={parseFloat(summary.healthFactor)}
                decimals={2}
                className={`text-sm font-medium ${getHealthFactorColor(summary.healthFactor)}`}
              />
            )}
            <div className="relative group">
              <button type="button" className="text-[#555555] hover:text-[#888888] transition-colors">
                <Info size={14} />
              </button>
              {/* Tooltip */}
              <div className="absolute right-0 bottom-full mb-2 px-3 py-2 bg-[#1A1A1A] border border-[#333333] rounded-lg text-xs text-[#CCCCCC] w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <p>Health Factor represents the safety of your loan. A value below 1.0 means your position is at risk of liquidation.</p>
                <div className="absolute right-2 top-full w-2 h-2 bg-[#1A1A1A] border-r border-b border-[#333333] rotate-45 -mt-1" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-px bg-[#1F1F1F]" />

        {/* Metrics */}
        <div className='flex flex-col gap-2'>
          <div className="flex justify-between items-center">
            <span className="text-[#666666] text-xs leading-[16px] font-medium uppercase tracking-wide">SUPPLIED</span>
            <CountUp
              end={parseFloat(summary.totalSupplied)}
              decimals={2}
              prefix="$"
              className="text-[#FFFFFF] text-sm leading-[20px] font-medium"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#666666] text-xs leading-[16px] font-medium uppercase tracking-wide">BORROWED</span>
            <CountUp
              end={parseFloat(summary.totalBorrowed)}
              decimals={2}
              prefix="$"
              className="text-[#FFFFFF] text-sm leading-[20px] font-medium"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#666666] text-xs leading-[16px] font-medium uppercase tracking-wide">EARNING</span>
            <CountUp
              end={parseFloat(summary.totalEarnings)}
              decimals={2}
              prefix="$"
              className="text-[#FFFFFF] text-sm leading-[20px] font-medium"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#666666] text-xs leading-[16px] font-medium uppercase tracking-wide">POWER</span>
            <CountUp
              end={parseFloat(summary.borrowingPower)}
              decimals={2}
              prefix="$"
              className="text-[#FFFFFF] text-sm leading-[20px] font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


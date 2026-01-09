import { AlertCircle } from 'lucide-react';
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
    return 'text-[#2ECC71]';
  };

  const isInfinity = (hf: string) => {
    const num = parseFloat(hf);
    return num > 999;
  };

  if (loading) {
    return (
      <div className="bg-[#242424] rounded-[20px] p-[18px] h-[316px] flex flex-col gap-[18px] border border-[#404040]">
        <span className="text-[#E0E0E0] text-xl font-medium">Summary</span>
        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Net APY</span>
            <span className="text-[#2ECC71] font-medium">0.00%</span>
          </div>
          <div className="w-full h-px bg-[#383838]"></div>
          
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Health Factor</span>
            <span className="text-[#2ECC71] font-medium">0.00%</span>
          </div>
          <div className="w-full h-px bg-[#383838]"></div>
          
          <div className="flex flex-col gap-[10px]">
            <div className="flex flex-row justify-between items-center">
              <span className="text-[#A0A0A0] font-dm-sans">Total Supplied</span>
              <span className="text-[#E0E0E0] font-medium">$0.00</span>
            </div>
            <div className="flex flex-row justify-between items-center">
              <span className="text-[#A0A0A0] font-dm-sans">Total Borrowed</span>
              <span className="text-[#E0E0E0] font-medium">$0.00</span>
            </div>
            <div className="flex flex-row justify-between items-center">
              <span className="text-[#A0A0A0] font-dm-sans">Total Earning</span>
              <span className="text-[#E0E0E0] font-medium">$0.00</span>
            </div>
            <div className="flex flex-row justify-between items-center">
              <span className="text-[#A0A0A0] font-dm-sans">Borrowing Power</span>
              <span className="text-[#E0E0E0] font-medium">$0.00</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#242424] rounded-[20px] p-[18px] h-[316px] flex flex-col gap-[18px] border border-[#404040]">
        <span className="text-[#E0E0E0] text-xl font-medium">Summary</span>
        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-[#A0A0A0] text-sm text-center font-dm-sans">Failed to load summary</span>
            <span className="text-[#666666] text-xs text-center font-dm-sans">Please try again later</span>
          </div>
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
    <div className="bg-[#242424] rounded-[20px] p-[18px] h-fit flex flex-col gap-[18px] border border-[#404040]">
      <span className="text-[#E0E0E0] text-xl font-medium">Summary</span>
      <div className="flex flex-col gap-[14px]">
        <div className="flex flex-row justify-between items-center">
          <span className="text-[#A0A0A0] font-dm-sans">Net APY</span>
          <CountUp
            end={parseFloat(summary.netAPY)}
            decimals={2}
            suffix="%"
            className="text-[#2ECC71] font-medium"
          />
        </div>
        <div className="w-full h-px bg-[#383838]"></div>
        
        <div className="flex flex-row justify-between items-center">
          <span className="text-[#A0A0A0] font-dm-sans">Health Factor</span>
          {isInfinity(summary.healthFactor) ? (
            <span className={`font-dm-sans font-medium ${getHealthFactorColor(summary.healthFactor)}`}>
              ∞
            </span>
          ) : (
            <CountUp
              end={parseFloat(summary.healthFactor)}
              decimals={2}
              className={`font-dm-sans font-medium ${getHealthFactorColor(summary.healthFactor)}`}
            />
          )}
        </div>
        <div className="w-full h-px bg-[#383838]"></div>

        <div className='flex flex-col gap-[10px]'>
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Total Supplied</span>
            <CountUp
              end={parseFloat(summary.totalSupplied)}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>
          
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Total Borrowed</span>
            <CountUp
              end={parseFloat(summary.totalBorrowed)}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>
          
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Total Earning</span>
            <CountUp
              end={parseFloat(summary.totalEarnings)}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>
          
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Borrowing Power</span>
            <CountUp
              end={parseFloat(summary.borrowingPower)}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

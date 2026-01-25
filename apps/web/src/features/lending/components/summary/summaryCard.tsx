import { AlertCircle } from 'lucide-react';
import type { LendingSummary } from '../../types/lending.types';
import CountUp from './countUp';

interface SummaryCardProps {
  data: LendingSummary;
  loading: boolean;
  error: Error | null;
  variant?: 'desktop' | 'mobile';
}

export default function SummaryCard({
  data,
  loading,
  error,
  variant = 'desktop',
}: SummaryCardProps) {
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

  // Calculate borrowing utilization for progress bar
  const getBorrowingUtilization = () => {
    const borrowed = parseFloat(data?.totalBorrowed || '0');
    const power = parseFloat(data?.borrowingPower || '0');
    if (power <= 0) return 0;
    return Math.min((borrowed / (borrowed + power)) * 100, 100);
  };

  // Format large numbers with K suffix
  const formatCompactValue = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}k`;
    }
    return `$${num.toFixed(2)}`;
  };

  // Mobile Loading State
  if (loading && variant === 'mobile') {
    return (
      <div className="bg-[#111111] rounded-[16px] p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-row justify-between items-center py-2">
            <span className="text-[#808080] text-sm">Net APY</span>
            <span className="text-[#2ECC71] font-medium">--</span>
          </div>
          <div className="w-full h-px bg-[#222222]"></div>
          <div className="flex flex-row justify-between items-center py-2">
            <span className="text-[#808080] text-sm">Health Factor</span>
            <span className="text-[#2ECC71] font-medium">--</span>
          </div>
          <div className="w-full h-px bg-[#222222]"></div>
          <div className="flex flex-row justify-between items-center py-2">
            <span className="text-[#808080] text-sm">Borrowing Power</span>
            <span className="text-white text-xl font-semibold">--</span>
          </div>
          <div className="w-full h-1.5 bg-[#333333] rounded-full"></div>
          <div className="w-full h-px bg-[#222222]"></div>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-[#666666] text-xs">Total Supplied</span>
              <span className="text-white text-lg font-semibold">--</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#666666] text-xs">Total Borrowed</span>
              <span className="text-white text-lg font-semibold">--</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Loading State
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

  return (
    <div className="bg-[#242424] rounded-[20px] p-[18px] h-fit flex flex-col gap-[18px] border border-[#404040]">
      <span className="text-[#E0E0E0] text-xl font-medium">Summary</span>
      <div className="flex flex-col gap-[14px]">
        <div className="flex flex-row justify-between items-center">
          <span className="text-[#A0A0A0] font-dm-sans">Net APY</span>
          <CountUp
            end={parseFloat(data.netAPY)}
            decimals={2}
            suffix="%"
            className="text-[#2ECC71] font-medium"
          />
        </div>
        <div className="w-full h-px bg-[#383838]"></div>
        
        <div className="flex flex-row justify-between items-center">
          <span className="text-[#A0A0A0] font-dm-sans">Health Factor</span>
          {isInfinity(data.healthFactor) ? (
            <span className={`font-dm-sans font-medium ${getHealthFactorColor(data.healthFactor)}`}>
              ∞
            </span>
          ) : (
            <CountUp
              end={parseFloat(data.healthFactor)}
              decimals={2}
              className={`font-dm-sans font-medium ${getHealthFactorColor(data.healthFactor)}`}
            />
          )}
        </div>
        <div className="w-full h-px bg-[#383838]"></div>

        <div className='flex flex-col gap-[10px]'>
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Total Supplied</span>
            <CountUp
              end={parseFloat(data.totalSupplied)}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>
          
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Total Borrowed</span>
            <CountUp
              end={parseFloat(data.totalBorrowed)}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>
          
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Total Earning</span>
            <CountUp
              end={parseFloat(data.totalEarnings)}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>
          
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Borrowing Power</span>
            <CountUp
              end={parseFloat(data.borrowingPower)}
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

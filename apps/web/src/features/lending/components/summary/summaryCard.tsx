import { AlertCircle, ShieldCheck } from 'lucide-react';
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

  // Mobile Error State
  if (error && variant === 'mobile') {
    return (
      <div className="bg-[#111111] rounded-[16px] p-4 flex flex-col gap-3">
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-[#808080] text-sm text-center">Failed to load summary</span>
        </div>
      </div>
    );
  }

  // Desktop Error State
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

  // Mobile Variant
  if (variant === 'mobile') {
    const utilization = getBorrowingUtilization();

    return (
      <div className='flex flex-col gap-3'>
        <span className='text-white text-sm leading-[20px] font-semibold'>Summary</span>
        <div className="bg-[#0C0C0C] border border-[#1F1F1F] rounded-[24px] p-2 flex flex-col">
          {/* Net APY Row */}
          <div className="flex flex-row justify-between items-center p-3">
            <span className="text-[#888888] text-xs leading-[16px] font-medium">Net APY</span>
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="8" width="3" height="5" rx="0.5" fill="#2ECC71" />
                <rect x="5.5" y="5" width="3" height="8" rx="0.5" fill="#2ECC71" />
                <rect x="10" y="1" width="3" height="12" rx="0.5" fill="#2ECC71" />
              </svg>
              <CountUp
                end={parseFloat(data?.netAPY || "0")}
                decimals={2}
                suffix="%"
                className="text-[#2ECC71] font-semibold text-sm"
              />
            </div>
          </div>

          <div className="w-full px-3">
            <div className='h-px bg-[#161616]'></div>
          </div>

          {/* Health Factor Row */}
          <div className="flex flex-row justify-between items-center p-3">
            <span className="text-[#888888] text-xs leading-[16px] font-medium">Health Factor</span>
            <div className="flex items-center gap-1">
              <ShieldCheck size={16} strokeWidth={2} className="text-[#2ECC71]" />
              {isInfinity(data?.healthFactor || "0") ? (
                <span className={`font-semibold text-sm ${getHealthFactorColor(data?.healthFactor || "0")}`}>
                  ∞
                </span>
              ) : (
                <CountUp
                  end={parseFloat(data?.healthFactor || "0")}
                  decimals={2}
                  className={`font-semibold text-sm ${getHealthFactorColor(data?.healthFactor || "0")}`}
                />
              )}
            </div>
          </div>

          <div className="w-full px-3">
            <div className='h-px bg-[#161616]'></div>
          </div>

          {/* Borrowing Power Row with Progress Bar */}
          <div className="flex flex-row justify-between items-center p-3">
            <span className="text-[#888888] text-xs leading-[16px] font-medium">Borrowing Power</span>
            <div className='flex flex-col gap-1.5 w-[80px]'>
              <CountUp
                end={parseFloat(data?.borrowingPower || "0")}
                decimals={2}
                prefix="$"
                separator=","
                className="text-white text-sm leading-[20px] font-medium text-right"
              />
              <div className="w-full h-1 bg-[#222222] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#E26B1D] to-[#F07830] transition-all duration-500"
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-full px-3">
            <div className='h-px bg-[#161616]'></div>
          </div>

          {/* Bottom Section: Total Supplied & Total Borrowed in two columns */}
          <div className="flex">
            <div className="flex flex-col gap-0.5 p-3 items-center justify-center w-full">
              <span className="text-[#666666] text-[10px] leading-[15px] font-medium">Total Supplied</span>
              <span className="text-white text-xs leading-[16px] font-medium">
                {formatCompactValue(data?.totalSupplied || "0")}
              </span>
            </div>
            <div className='h-full w-px bg-[#161616]'></div>
            <div className="flex flex-col gap-0.5 p-3 items-center justify-center w-full">
              <span className="text-[#666666] text-[10px] leading-[15px] font-medium">Total Borrowed</span>
              <span className="text-white text-xs leading-[16px] font-medium">
                {formatCompactValue(data?.totalBorrowed || "0")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Variant (Original)
  return (
    <div className="bg-[#242424] rounded-[20px] p-[18px] h-fit flex flex-col gap-[18px] border border-[#404040]">
      <span className="text-[#E0E0E0] text-xl font-medium">Summary</span>
      <div className="flex flex-col gap-[14px]">
        <div className="flex flex-row justify-between items-center">
          <span className="text-[#A0A0A0] font-dm-sans">Net APY</span>
          <CountUp
            end={parseFloat(data?.netAPY || "0")}
            decimals={2}
            suffix="%"
            className="text-[#2ECC71] font-medium"
          />
        </div>
        <div className="w-full h-px bg-[#383838]"></div>

        <div className="flex flex-row justify-between items-center">
          <span className="text-[#A0A0A0] font-dm-sans">Health Factor</span>
          {isInfinity(data?.healthFactor || "0") ? (
            <span className={`font-dm-sans font-medium ${getHealthFactorColor(data?.healthFactor || "0")}`}>
              ∞
            </span>
          ) : (
            <CountUp
              end={parseFloat(data?.healthFactor || "0")}
              decimals={2}
              className={`font-dm-sans font-medium ${getHealthFactorColor(data?.healthFactor || "0")}`}
            />
          )}
        </div>
        <div className="w-full h-px bg-[#383838]"></div>

        <div className='flex flex-col gap-[10px]'>
          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Total Supplied</span>
            <CountUp
              end={parseFloat(data?.totalSupplied || "0")}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>

          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Total Borrowed</span>
            <CountUp
              end={parseFloat(data?.totalBorrowed || "0")}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>

          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Total Earning</span>
            <CountUp
              end={parseFloat(data?.totalEarnings || "0")}
              decimals={2}
              prefix="$"
              className="text-[#E0E0E0] font-medium"
            />
          </div>

          <div className="flex flex-row justify-between items-center">
            <span className="text-[#A0A0A0] font-dm-sans">Borrowing Power</span>
            <CountUp
              end={parseFloat(data?.borrowingPower || "0")}
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


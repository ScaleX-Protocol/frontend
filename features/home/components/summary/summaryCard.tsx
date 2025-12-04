import { Loader2, AlertCircle } from 'lucide-react';
import type { LendingSummary } from '@/features/lending/types/lending.types';

interface SummaryCardProps {
  data?: LendingSummary;
  loading?: boolean;
  error?: Error | null;
}

export default function SummaryCard({ data, loading = false, error = null }: SummaryCardProps) {
  const formatHealthFactor = (hf: string) => {
    const num = parseFloat(hf);
    if (num > 999) return '∞';
    return num.toFixed(2);
  };

  const getHealthFactorColor = (hf: string) => {
    const num = parseFloat(hf);
    if (num < 1.5) return 'text-red-500';
    if (num < 2.0) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="bg-[#2C2C2C] rounded-md p-2 h-[297px] flex flex-col gap-2">
        <span className="text-[#E0E0E0] text-xl font-medium">Summary</span>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#A0A0A0]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#2C2C2C] rounded-md p-2 h-[297px] flex flex-col gap-2">
        <span className="text-[#E0E0E0] text-xl font-medium">Summary</span>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span className="text-red-400 text-sm text-center">Failed to load summary</span>
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
    <div className="bg-[#2C2C2C] rounded-md p-4 h-fit flex flex-col gap-2">
      <span className="text-[#E0E0E0] text-xl font-medium">Summary</span>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Total Supplied</span>
          <span className="text-[#E0E0E0]">${parseFloat(summary.totalSupplied).toLocaleString()}</span>
        </div>
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Total Borrowed</span>
          <span className="text-[#E0E0E0]">${parseFloat(summary.totalBorrowed).toLocaleString()}</span>
        </div>
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Total Earning</span>
          <span className="text-[#E0E0E0]">${parseFloat(summary.totalEarnings).toLocaleString()}</span>
        </div>
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Net APY</span>
          <span className="text-[#E0E0E0]">{summary.netAPY}%</span>
        </div>
        <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
          <span className="text-[#A0A0A0]">Borrowing Power</span>
          <span className="text-[#E0E0E0]">${parseFloat(summary.borrowingPower).toLocaleString()}</span>
        </div>
        <div className="flex flex-row justify-between items-center">
          <span className="text-[#A0A0A0]">Health Factor</span>
          <span className={`text-[#E0E0E0] ${getHealthFactorColor(summary.healthFactor)}`}>
            {formatHealthFactor(summary.healthFactor)}
          </span>
        </div>
      </div>
    </div>
  );
}

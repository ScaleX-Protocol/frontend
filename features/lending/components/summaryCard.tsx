import { AlertCircle, Loader2 } from 'lucide-react';
import type { LendingSummary } from '../types/lending.types';

export default function SummaryCard({
  data,
  loading,
  error,
}: {
  data: LendingSummary;
  loading: boolean;
  error: Error | null;
}) {
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
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#A0A0A0]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <span className="text-red-400 text-sm text-center">Failed to load summary</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
        <span className="text-[#A0A0A0]">Total Supplied</span>
        <span className="text-[#E0E0E0]">${parseFloat(data.totalSupplied).toLocaleString()}</span>
      </div>
      <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
        <span className="text-[#A0A0A0]">Total Borrowed</span>
        <span className="text-[#E0E0E0]">${parseFloat(data.totalBorrowed).toLocaleString()}</span>
      </div>
      <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
        <span className="text-[#A0A0A0]">Total Earning</span>
        <span className="text-[#E0E0E0]">${parseFloat(data.totalEarnings).toLocaleString()}</span>
      </div>
      <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
        <span className="text-[#A0A0A0]">Net APY</span>
        <span className="text-[#E0E0E0]">{data.netAPY}%</span>
      </div>
      <div className="flex flex-row justify-between items-center pb-2 border-b border-[#3A3A3A]">
        <span className="text-[#A0A0A0]">Borrowing Power</span>
        <span className="text-[#E0E0E0]">${parseFloat(data.borrowingPower).toLocaleString()}</span>
      </div>
      <div className="flex flex-row justify-between items-center">
        <span className="text-[#A0A0A0]">Health Factor</span>
        <span className={`text-[#E0E0E0] ${getHealthFactorColor(data.healthFactor)}`}>
          {formatHealthFactor(data.healthFactor)}
        </span>
      </div>
    </div>
  );
}

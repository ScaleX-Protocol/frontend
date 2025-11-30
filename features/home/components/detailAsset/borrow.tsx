import { TokenIcon } from '../tokenIcon';
import { Loader2, AlertCircle } from 'lucide-react';
import { LendingBorrow } from '@/features/lending/types/lending.types';

interface BorrowCardProps {
  data?: LendingBorrow[];
  loading?: boolean;
  error?: Error | null;
}

export default function BorrowCard({ data, loading = false, error = null }: BorrowCardProps) {
  if (loading) {
    return (
      <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-2 p-2">
        <span className="text-[#E0E0E0] text-xl font-medium">Borrow Asset</span>
        <div className="border border-[#3A3A3A] rounded-xl overflow-hidden backdrop-blur-sm shadow-xl h-40 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#A0A0A0]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-2 p-2">
        <span className="text-[#E0E0E0] text-xl font-medium">Borrow Asset</span>
        <div className="border border-[#3A3A3A] rounded-xl overflow-hidden backdrop-blur-sm shadow-xl h-40 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span className="text-red-400 text-sm text-center">Failed to load borrow assets</span>
          </div>
        </div>
      </div>
    );
  }

  const borrowAssets = data || [];

  if (borrowAssets.length === 0) {
    return (
      <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-2 p-2">
        <span className="text-[#E0E0E0] text-xl font-medium">Borrow Asset</span>
        <div className="border border-[#3A3A3A] rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="p-4 text-center">
            <span className="text-[#A0A0A0]">No borrowed assets found</span>
          </div>
        </div>
      </div>
    );
  }

  const getHealthStatusColor = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'danger': return 'bg-red-500/20 text-red-400 border border-red-500/20';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20';
      case 'safe': return 'bg-green-500/20 text-green-400 border border-green-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/20';
    }
  };

  return (
    <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-2 p-2">
      <span className="text-[#E0E0E0] text-xl font-medium">Borrow Asset</span>
      <div className="border border-[#3A3A3A] rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#3A3A3A]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider text-left">
                  Asset
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider text-center">
                  Balance
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider text-right">
                  APY
                </th>
              </tr>
            </thead>
            <tbody>
              {borrowAssets.map((asset) => (
                <tr key={asset.id} className="bg-[#2A2A2A] hover:bg-[#333333] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={`gs${asset.asset}`} />
                      <div className="flex flex-col">
                        <span className="text-[#E0E0E0] text-sm">{asset.asset}</span>
                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${getHealthStatusColor(asset.healthStatus)}`}>
                          HF: {parseFloat(asset.healthFactor).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-[#E0E0E0] text-sm text-center">{asset.borrowedAmount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-[#E0E0E0] text-sm text-right">{asset.apy}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

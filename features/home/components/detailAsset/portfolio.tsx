import { TokenIcon } from '../tokenIcon';
import { Loader2, AlertCircle } from 'lucide-react';
import { LendingSupply } from '@/features/lending/types/lending.types';

interface PortfolioCardProps {
  data?: LendingSupply[];
  loading?: boolean;
  error?: Error | null;
}

export default function PortfolioCard({ data, loading = false, error = null }: PortfolioCardProps) {
  if (loading) {
    return (
      <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-2 p-2">
        <span className="text-[#E0E0E0] text-xl font-medium">Portfolio Asset</span>
        <div className="border border-[#3A3A3A] rounded-xl overflow-hidden backdrop-blur-sm shadow-xl h-40 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#A0A0A0]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-2 p-2">
        <span className="text-[#E0E0E0] text-xl font-medium">Portfolio Asset</span>
        <div className="border border-[#3A3A3A] rounded-xl overflow-hidden backdrop-blur-sm shadow-xl h-40 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span className="text-red-400 text-sm text-center">Failed to load portfolio</span>
          </div>
        </div>
      </div>
    );
  }

  const portfolioAssets = data || [];

  if (portfolioAssets.length === 0) {
    return (
      <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-2 p-2">
        <span className="text-[#E0E0E0] text-xl font-medium">Portfolio Asset</span>
        <div className="border border-[#3A3A3A] rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="p-4 text-center">
            <span className="text-[#A0A0A0]">No assets in portfolio</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-2 p-2">
      <span className="text-[#E0E0E0] text-xl font-medium">Portfolio Asset</span>
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
              {portfolioAssets.map((asset) => (
                <tr key={asset.id} className="bg-[#2A2A2A] hover:bg-[#333333] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={`gs${asset.asset}`} />
                      <div className="flex flex-col">
                        <span className="text-[#E0E0E0] text-sm">{asset.asset}</span>
                        <span className="text-[#A0A0A0] text-xs">{asset.currentValue}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-[#E0E0E0] text-sm text-center">{asset.suppliedAmount}</div>
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

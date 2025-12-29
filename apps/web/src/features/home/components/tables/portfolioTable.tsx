import type { LendingSupply } from '@/features/lending/types/lending.types';
import { TokenIcon } from '../tokenIcon';

export default function PortfolioTable({ data, isLoading, error }: { data: LendingSupply[], isLoading: boolean; error: Error | null }) {
  return (
    <div className="border border-[#3A3A3A] rounded-md overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#3A3A3A]">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider text-left">
                Asset
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider text-center">
                Balance
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider text-right">
                APY
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
                    <span className="text-[#E0E0E0]/70">Loading portfolio assets...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={3} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-400 font-medium">Failed to load data</span>
                    <span className="text-[#E0E0E0]/60 text-sm">{error.message}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-[#E0E0E0]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-[#E0E0E0]/70">No Portfolio Assets</span>
                    <span className="text-[#E0E0E0]/50 text-sm">Your portfolio assets will appear here</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((asset) => (
                <tr key={asset.id} className="bg-[#2A2A2A] hover:bg-[#333333] transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={`gs${asset.asset}`} />
                      <span className="text-[#E0E0E0]">{asset.asset}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-[#E0E0E0] text-center">{asset.suppliedAmount} {asset.asset}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-[#E0E0E0] text-right">{asset.apy}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

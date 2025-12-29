import type { LendingBorrow } from '@/features/lending/types/lending.types';
import { TokenIcon } from './tokenIcon';

export default function BorrowedTable({
  data,
  isLoading,
  error,
  onRepayClick,
}: {
  data: LendingBorrow[];
  isLoading: boolean;
  error: Error | null;
  onRepayClick: () => void;
}) {
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
                Amount
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider text-center">
                Accrued Interest
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider text-center">
                APY
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
                    <span className="text-[#E0E0E0]/70">Loading borrow assets...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <title>Failed to load data</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-400 font-medium">Failed to load data</span>
                    <span className="text-[#E0E0E0]/60 text-sm">{error.message}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-[#E0E0E0]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <title>No Borrow Assets</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-[#E0E0E0]/70">No Borrow Assets</span>
                    <span className="text-[#E0E0E0]/50 text-sm">Borrow against your collateral to amplify your buying power</span>
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
                    <div className="text-[#E0E0E0] text-center">{asset.currentDebt}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-center">
                      <div className="text-red-400 font-medium">{asset.accruedInterest?.amount || '0.00'} {asset.asset}</div>
                      <div className="text-[#E0E0E0]/60 text-xs">{asset.accruedInterest?.duration || '0d 0h'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-[#E0E0E0] text-center">{asset.apy}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={onRepayClick}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-md font-medium transition-colors"
                      >
                        Repay
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white text-xs rounded-md transition-colors"
                      >
                        Details
                      </button>
                    </div>
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

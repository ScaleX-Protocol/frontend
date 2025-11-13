import { useBalances } from '@/features/trade/hooks/history/useBalances';
import { formatNumber } from '@/features/trade/utils/history.helper';

export default function Balances() {
  const { data: balances, isLoading } = useBalances();

  const totalBalance = balances?.reduce((sum, b) => sum + b.usdValue, 0) ?? 0;

  return (
    <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full border border-[#3A3A3A]">
          <thead className="bg-[#3A3A3A]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Locked
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                USD Value
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                % of Portfolio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]">
            {balances?.map((balance) => {
              const percentage = (balance.usdValue / totalBalance) * 100;
              return (
                <tr key={balance.symbol} className="hover:bg-[#3D3D3D] transition-colors">
                  <td className="px-6 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F06718] flex items-center justify-center font-bold text-sm">
                        {balance.symbol.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#E0E0E0]">{balance.token}</div>
                        <div className="text-xs text-slate-400">{balance.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-right text-slate-200">
                    {formatNumber(balance.available, 4)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-right text-slate-400">
                    {formatNumber(balance.locked, 4)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-right font-medium text-[#E0E0E0]">
                    {formatNumber(balance.total, 4)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-right font-semibold text-[#E0E0E0]">
                    ${formatNumber(balance.usdValue)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-blue-500 to-purple-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-300 w-12 text-right">{percentage.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

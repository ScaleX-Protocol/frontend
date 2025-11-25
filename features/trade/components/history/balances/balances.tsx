import { useAccount } from '@/features/trade/hooks/history/useAccount';
import type { Balance } from '@/features/trade/types/history.types';
import { useWalletState } from '@/hooks/useWalletState';

export default function Balances() {
  const wallet = useWalletState();
  const { data, isLoading, error } = useAccount(wallet.embeddedWallet.address);

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-[#E0E0E0] text-sm">Loading balances...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400 text-sm">Error loading balances</div>
        </div>
      </div>
    );
  }

  if (!data || !data.balances || data.balances.length === 0) {
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
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                  No balances found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Calculate total portfolio value
  const totalPortfolioValue = data.balances.reduce((sum, balance) => {
    return sum + balance.usdValue;
  }, 0);

  // Filter out zero balances and sort by USD value
  const nonZeroBalances = data.balances.filter((balance) => balance.total > 0).sort((a, b) => b.usdValue - a.usdValue);

  // Calculate price per unit for each asset
  const getAssetPrice = (balance: Balance) => {
    if (balance.total === 0) return 0;
    return balance.usdValue / balance.total;
  };

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
            {nonZeroBalances.map((balance) => {
              const portfolioPercentage = totalPortfolioValue > 0 ? (balance.usdValue / totalPortfolioValue) * 100 : 0;

              const hasLockedBalance = balance.locked > 0;
              const assetPrice = getAssetPrice(balance);

              return (
                <tr key={balance.token} className="bg-[#2A2A2A] hover:bg-[#333333] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-8 w-8 bg-[#3A3A3A] rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-[#E0E0E0]">{balance.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#E0E0E0]">{balance.symbol}</div>
                        <div className="text-xs text-gray-400">
                          ${assetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#E0E0E0] font-mono">
                    {balance.available.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                    <span className={hasLockedBalance ? 'text-yellow-400' : 'text-gray-500'}>
                      {balance.locked.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#E0E0E0] font-mono font-semibold">
                    {balance.total.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                    <span className="text-green-400 font-semibold">
                      $
                      {balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-[#3A3A3A] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(portfolioPercentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-[#E0E0E0] w-12 text-right">{portfolioPercentage.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-[#3A3A3A] font-semibold">
              <td className="px-6 py-4 text-sm text-[#E0E0E0]">Total Portfolio Value</td>
              <td colSpan={3}></td>
              <td className="px-6 py-4 text-sm text-right font-mono">
                <span className="text-green-400 text-base font-bold">
                  ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-right font-mono text-[#E0E0E0]">100.0%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

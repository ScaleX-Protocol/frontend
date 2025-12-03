import { TokenIcon } from '../tokenIcon';

export interface PortfolioAssets {
  name: string;
  icon: string;
  balance: string;
  apy: string;
}

export default function PortfolioTable({ portfolioAssets }: { portfolioAssets: PortfolioAssets[] }) {
  // const portfolioAssets = [
  //   { name: 'WETH', icon: 'W', balance: '0.00', apy: '5.0%' },
  //   { name: 'USDC', icon: 'U', balance: '0.00', apy: '8.0%' },
  // ];

  return (
    <div className="border border-[#3A3A3A] rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
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
            {portfolioAssets.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center">
                  <div className="text-[#E0E0E0]/70">No Portfolio Assets</div>
                </td>
              </tr>
            ) : (
              portfolioAssets.map((asset) => (
                <tr key={asset.name} className="bg-[#2A2A2A] hover:bg-[#333333] transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={`gs${asset.name}`} />
                      <span className="text-[#E0E0E0]">{asset.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-[#E0E0E0] text-center">{asset.balance}</div>
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

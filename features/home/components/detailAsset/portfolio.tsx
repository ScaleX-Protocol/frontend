import { TokenIcon } from '../tokenIcon';

export default function PortfolioCard() {
  const portfolioAssets = [
    { name: 'WETH', icon: 'W', balance: '0.00', apy: '5.0%' },
    { name: 'USDC', icon: 'U', balance: '0.00', apy: '8.0%' },
  ];

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
                <tr key={asset.name} className="bg-[#2A2A2A] hover:bg-[#333333] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <TokenIcon symbol={`gs${asset.name}`} />
                      <span className="text-[#E0E0E0] text-sm">{asset.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-[#E0E0E0] text-sm text-center">{asset.balance}</div>
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

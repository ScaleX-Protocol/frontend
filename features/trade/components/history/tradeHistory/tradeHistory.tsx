import { type UseTradesParams, useTrades } from '@/features/trade/hooks/history/useTrades';
import {
  calculateFee,
  calculateTotal,
  formatAmount,
  formatPrice,
  formatTime,
} from '@/features/trade/utils/history.helper';
import { useWalletState } from '@/hooks/useWalletState';

export default function TradeHistory({ symbol }: { symbol: string }) {
  const wallet = useWalletState();

  const params: UseTradesParams = {
    symbol: symbol,
    limit: 10,
    user: wallet.embeddedWallet.address,
    orderBy: 'desc',
  };

  const { data, isLoading, error } = useTrades(params);

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-[#E0E0E0] text-sm">Loading trade history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400 text-sm">Error loading trade history</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border border-[#3A3A3A]">
            <thead className="bg-[#3A3A3A]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Pair
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Fee
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  No trade history found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full border border-[#3A3A3A]">
          <thead className="bg-[#3A3A3A]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Pair
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Fee
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]">
            {data.map((trade) => {
              const isBuy = !trade.isBuyerMaker; // If not buyer maker, then it's a buy (taker buy)

              return (
                <tr key={trade.id} className="bg-[#2A2A2A] hover:bg-[#333333] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#E0E0E0]">
                    {symbol.replace('gs', '').replace('/', ' / ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                      {isBuy ? 'BUY' : 'SELL'}
                    </span>
                    <span className="text-gray-400 ml-1">/ Market</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#E0E0E0] font-mono">
                    ${formatPrice(trade.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#E0E0E0] font-mono">
                    {formatAmount(trade.qty)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#E0E0E0] font-mono">
                    ${calculateTotal(trade.price, trade.qty)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400 font-mono">
                    ${calculateFee(trade.price, trade.qty)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400">
                    {formatTime(trade.time)}
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

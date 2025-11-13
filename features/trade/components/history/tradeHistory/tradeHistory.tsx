import { useTradeHistory } from '@/features/trade/hooks/history/useTradeHistory';
import { formatDate } from '@/features/trade/utils/history.helper';
import { formatNumber } from '@/features/trade/utils/orderBook.helper';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function TradeHistory() {
  const { data: tradeHistory, isLoading } = useTradeHistory();

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
            {tradeHistory?.map((trade) => (
              <tr key={trade.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-semibold text-slate-100">{trade.pair}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {trade.type === 'buy' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trade.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-slate-200">${formatNumber(trade.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-slate-200">
                  {formatNumber(trade.amount, 4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-100">
                  ${formatNumber(trade.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-slate-400">${formatNumber(trade.fee)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-400">
                  {formatDate(trade.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

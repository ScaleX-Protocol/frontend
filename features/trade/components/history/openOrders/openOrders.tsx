import { useOpenOrders } from '@/features/trade/hooks/history/useOpenOrders_';
import type { OpenOrderStatus } from '@/features/trade/types/history.types';
import { formatDate } from '@/features/trade/utils/history.helper';
import { formatNumber } from '@/features/trade/utils/orderBook.helper';
import { CheckCircle, Clock, Loader, TrendingDown, TrendingUp } from 'lucide-react';

export default function OpenOrders() {
  const { data: openOrders, isLoading } = useOpenOrders();

  const getStatusIcon = (status: OpenOrderStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <Loader className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

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
                Filled
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]">
            {openOrders?.map((order) => (
              <tr key={order.id} className="hover:bg-[#3D3D3D] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-semibold text-[#E0E0E0]">{order.pair}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {order.type === 'buy' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {order.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-slate-200">${formatNumber(order.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-slate-200">
                  {formatNumber(order.amount, 4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-slate-200">{formatNumber(order.filled, 4)}</span>
                  <span className="text-slate-500 text-xs ml-1">
                    ({((order.filled / order.amount) * 100).toFixed(0)}%)
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-100">
                  ${formatNumber(order.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="text-sm capitalize text-slate-300">{order.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-400">
                  {formatDate(order.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

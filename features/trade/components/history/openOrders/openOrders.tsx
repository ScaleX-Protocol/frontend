import { type UseAllOrdersParams, useAllOrders } from '@/features/trade/hooks/history/useAllOrders';
import { formatAmount, formatPrice, formatTime } from '@/features/trade/utils/history.helper';
import { useWalletState } from '@/hooks/useWalletState';

export default function OpenOrders({ symbol }: { symbol: string }) {
  const wallet = useWalletState();

  const params: UseAllOrdersParams = {
    address: wallet.embeddedWallet.address,
    symbol: symbol,
    limit: 10,
  };

  const { data, isLoading, error } = useAllOrders(params);

  // how to get decimal in here bro?
  const baseDecimals = 18;
  const quoteDecimals = 6;

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-[#E0E0E0] text-sm">Loading orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400 text-sm">Error loading orders</div>
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
            <tbody>
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                  No orders found
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
            {data.map((order) => {
              const filledPercentage = (parseFloat(order.executedQty) / parseFloat(order.origQty)) * 100;
              const isBuy = order.side === 'BUY';

              return (
                <tr key={order.orderId} className="bg-[#2A2A2A] hover:bg-[#333333] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#E0E0E0]">
                    {order.symbol.replace('/', ' / ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>{order.side}</span>
                    <span className="text-gray-400 ml-1">/ {order.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#E0E0E0] font-mono">
                    ${formatPrice(order.price, quoteDecimals)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#E0E0E0] font-mono">
                    {formatAmount(order.origQty, baseDecimals)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[#E0E0E0]">{formatAmount(order.executedQty, baseDecimals)}</span>
                      <span className={`text-xs ${filledPercentage === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                        ({filledPercentage.toFixed(0)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#E0E0E0] font-mono">
                    ${formatPrice(order.cumulativeQuoteQty, baseDecimals)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        order.status === 'FILLED'
                          ? 'bg-green-900/30 text-green-400 border border-green-400/30'
                          : order.status === 'PARTIALLY_FILLED'
                            ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-400/30'
                            : 'bg-blue-900/30 text-blue-400 border border-blue-400/30'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400">
                    {formatTime(order.time)}
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

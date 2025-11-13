import { useMemo, useState } from 'react';
import type { OrderBookPrecision } from '../../../types/orderBook.types';
import { useOrderBook } from '../../../hooks/orderBook/useOrderBook';
import { formatLargeNumber, formatNumber } from '@/features/trade/utils/orderBook.helper';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import OrdersSkeleton from './ordersSkeleton';

export default function Orders() {
  const [precision, setPrecision] = useState<OrderBookPrecision>(0.01);
  // const [pattern, setPattern] = useState<OrderBookPattern>('bid-ask');

  const pattern = 'bid-ask';

  const { data: orderBook, isLoading: isLoadingOrderBook } = useOrderBook({
    pair: 'ETH/USDC',
    precision,
    pattern,
    limit: 5,
  });

  const maxDepth = useMemo(() => {
    if (!orderBook) return 0;

    const maxBidDepth = orderBook.bids.reduce((max, bid) => Math.max(max, bid.total), 0);
    const maxAskDepth = orderBook.asks.reduce((max, ask) => Math.max(max, ask.total), 0);

    return Math.max(maxBidDepth, maxAskDepth);
  }, [orderBook]);

  const reversedAsks = useMemo(() => {
    if (!orderBook) return [];
    return [...orderBook.asks].reverse();
  }, [orderBook]);

  const currentPrice = orderBook ? (orderBook.bids[0]?.price + orderBook.asks[0]?.price) / 2 : 0;
  const priceTrend = Math.random() > 0.5 ? 'up' : 'down';

  const precisionOptions: OrderBookPrecision[] = [0.1, 0.01, 0.001];

  if (isLoadingOrderBook) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center self-end py-2">
        <div className="relative">
          <select
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value) as OrderBookPrecision)}
            className="appearance-none text-[#E0E0E0] px-3 py-1 pr-8 rounded border border-[#E0E0E0]/20 focus:outline-none text-sm"
          >
            {precisionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="fill-current h-4 w-4 text-[#E0E0E0]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Dropdown arrow</title>
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 py-2 text-sm text-[#E0E0E0] border-y border-[#E0E0E0]/20">
        <div>Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="relative">
          {reversedAsks.map((order) => (
            <div key={order.price} className="relative group">
              <div
                className="absolute right-0 top-0 h-full bg-[#B91C1C]/20 group-hover:bg-[#B91C1C]/30 transition-colors"
                style={{ width: `${(order.total / maxDepth) * 100}%` }}
              ></div>

              <div className="relative grid grid-cols-3 py-1 text-sm">
                <div className="text-red-700">{formatNumber(order.price, 1)}</div>
                <div className="text-right text-[#E0E0E0]/70">{formatLargeNumber(order.size)}</div>
                <div className="text-right text-[#E0E0E0]/70">{formatLargeNumber(order.total)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-b border-[#E0E0E0]/20]">
          <div className="py-2 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg font-medium text-[#E0E0E0] mr-2">{formatNumber(currentPrice, 1)}</span>
              <span className={`${priceTrend === 'up' ? 'text-green-700' : 'text-red-700'}`}>
                {priceTrend === 'up' ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-[#E0E0E0] font-medium mr-2">Spread</span>
              <span className="text-[#E0E0E0]/70">{(orderBook?.spreadPercentage || 0).toFixed(4)}%</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {orderBook?.bids.map((order) => (
            <div key={order.price} className="relative group">
              <div
                className="absolute right-0 top-0 h-full bg-[#4ADE80]/20 group-hover:bg-[#4ADE80]/30 transition-colors"
                style={{ width: `${(order.total / maxDepth) * 100}%` }}
              ></div>

              <div className="relative grid grid-cols-3 py-1 text-sm">
                <div className="text-green-700">{formatNumber(order.price, 1)}</div>
                <div className="text-right text-[#E0E0E0]/70">{formatLargeNumber(order.size)}</div>
                <div className="text-right text-[#E0E0E0]/70">{formatLargeNumber(order.total)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useTrades, type UseTradesParams } from '@/features/trade/hooks/orderBook/useTrades';
import { calculateTotal, formatAmount, formatPrice } from '@/features/trade/utils/orderBook.helper';

export default function Trades({ symbol }: { symbol: string }) {
  const params: UseTradesParams = {
    symbol,
    limit: 10,
    orderBy: 'desc',
  };

  const { data, isLoading, error } = useTrades(params);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#3A3A3A]">
          <div className="flex gap-1">
            <div className="w-8 h-8 bg-[#3A3A3A] rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-400 border-b border-[#3A3A3A]">
          <div className="flex-1 text-left">Price</div>
          <div className="flex-1 text-center">Size</div>
          <div className="flex-1 text-right">Time</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#E0E0E0] text-sm">Loading trades...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-400 border-b border-[#3A3A3A]">
          <div className="flex-1 text-left">Price</div>
          <div className="flex-1 text-center">Size</div>
          <div className="flex-1 text-right">Time</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="text-red-400 text-sm">Error loading trades</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-400 border-b border-[#3A3A3A]">
          <div className="flex-1 text-left">Price</div>
          <div className="flex-1 text-center">Size</div>
          <div className="flex-1 text-right">Time</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="text-[#E0E0E0] text-sm">No trades available</div>
        </div>
      </div>
    );
  }

  // Format time for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Matching column headers */}
      <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-400 border-b border-[#3A3A3A]">
        <div className="flex-1 text-left">Price</div>
        <div className="flex-1 text-center">Size</div>
        <div className="flex-1 text-right">Time</div>
      </div>

      {/* Trades list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {data.map((trade) => (
          <div key={trade.id} className="px-3 py-1 hover:bg-[#3A3A3A] cursor-pointer transition-colors">
            <div className="flex items-center text-xs font-mono">
              <div className={`flex-1 text-left ${trade.isBuyerMaker ? 'text-green-400' : 'text-red-400'}`}>
                {formatPrice(trade.price)}
              </div>
              <div className="flex-1 text-center text-[#E0E0E0]">
                <div>{formatAmount(trade.qty)}</div>
                <div className="text-[10px] text-gray-500">Total {calculateTotal(trade.price, trade.qty)}</div>
              </div>
              <div className="flex-1 text-right text-gray-400">{formatTime(trade.time)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

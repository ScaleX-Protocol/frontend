import { useTrades } from '../../../hooks/orderBook/useTrades';
import TradesSkeleton from './tradesSkeleton';

export default function Trades() {
  const { data: trades, isLoading: isLoadingTrades } = useTrades({
    pair: 'ETH/USDC',
    limit: 50,
  });

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-3 py-2 text-sm text-[#E0E0E0] border-b border-[#E0E0E0]/20">
        <div>Price</div>
        <div className='ml-4'>Size</div>
        <div className="text-right">Time</div>
      </div>
      <div className="h-full max-h-[373px] overflow-y-auto no-scrollbar">
        {isLoadingTrades ? (
          <TradesSkeleton />
        ) : (
          trades?.map((trade) => (
            <div key={trade.id}>
              <div className="relative grid grid-cols-3 py-1 text-sm">
                <div className={`${trade.side === 'buy' ? 'text-green-700' : 'text-red-700'}`}>
                  {trade.price.toFixed(3)}
                </div>
                <div className="text-[#E0E0E0]/70 ml-4">{trade.total.toFixed(3)}</div>
                <div className="text-right text-[#E0E0E0]/70">{new Date(trade.time).toLocaleTimeString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

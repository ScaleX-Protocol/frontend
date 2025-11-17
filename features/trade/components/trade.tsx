import { useMarkets } from '../hooks/chart/useMarkets';
import Chart from './chart/chart';
import History from './history/history';
import OrderBook from './orderBook/orderBook';
import PlaceOrder from './placeOrder/placeOrder';

export default function Trade() {
  const { data, isLoading, error } = useMarkets();

  if (isLoading || error || !data) return;

  // this is temporary logic, can be improve align with development process
  const marketData = data[0];

  const symbol = `${marketData.baseAsset}/${marketData.quoteAsset}`;

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col">
      <div className="grid grid-cols-[minmax(0,1fr)_300px_300px] gap-4 h-fit">
        <Chart symbol={symbol} />
        <OrderBook symbol={symbol} />
        <PlaceOrder />
      </div>
      <History symbol={symbol} />
    </div>
  );
}

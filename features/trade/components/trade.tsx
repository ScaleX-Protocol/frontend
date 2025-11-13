import Chart from "./chart/chart";
import History from "./history/history";
import OrderBook from "./orderBook/orderBook";
import PlaceOrder from "./placeOrder/placeOrder";

export default function Trade() {
  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col">
      <div className="grid grid-cols-[minmax(0,1fr)_300px_300px] gap-4 h-[364px]">
        <Chart />
        <OrderBook />
        <PlaceOrder />
      </div>
      <History />
    </div>
  );
}

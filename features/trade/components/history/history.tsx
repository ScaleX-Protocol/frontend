import { useState } from 'react';
import Balances from './balances/balances';
import OpenOrders from './openOrders/openOrders';
import OrderHistory from './orderHistory/orderHistory';
import TradeHistory from './tradeHistory/tradeHistory';

interface HistoryProps {
  symbol: string;
  baseDecimals: number;
  quoteDecimals: number;
}

export default function History({ symbol, baseDecimals, quoteDecimals }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'trades' | 'balances'>('orders');

  return (
    <div className="w-full flex-1 bg-[#2C2C2C] mt-4 rounded-md p-2">
      <div className="flex items-center mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-2 pt-0 text-lg font-medium ${
            activeTab === 'orders' ? 'text-[#E0E0E0] border-b border-[#F06718]' : 'text-[#E0E0E0]/70'
          }`}
        >
          Open Orders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 pt-0 text-lg font-medium ${
            activeTab === 'history' ? 'text-[#E0E0E0] border-b border-[#F06718]' : 'text-[#E0E0E0]/70'
          }`}
        >
          Order History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trades')}
          className={`px-6 py-2 pt-0 text-lg font-medium ${
            activeTab === 'trades' ? 'text-[#E0E0E0] border-b border-[#F06718]' : 'text-[#E0E0E0]/70'
          }`}
        >
          Trade History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('balances')}
          className={`px-6 py-2 pt-0 text-lg font-medium ${
            activeTab === 'balances' ? 'text-[#E0E0E0] border-b border-[#F06718]' : 'text-[#E0E0E0]/70'
          }`}
        >
          Balances
        </button>
      </div>
      {activeTab === 'orders' && <OpenOrders symbol={symbol} />}
      {activeTab === 'history' && <OrderHistory symbol={symbol} />}
      {activeTab === 'trades' && <TradeHistory symbol={symbol} baseDecimals={baseDecimals} quoteDecimals={quoteDecimals} />}
      {activeTab === 'balances' && <Balances />}
    </div>
  );
}

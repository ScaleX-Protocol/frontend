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

type HistoryTab = 'orders' | 'history' | 'trades' | 'balances';

const TABS: { key: HistoryTab; label: string }[] = [
  { key: 'orders', label: 'Open Orders' },
  { key: 'history', label: 'Open History' },
  { key: 'trades', label: 'Trade History' },
  { key: 'balances', label: 'Balances' },
];

export default function History({ symbol, baseDecimals, quoteDecimals }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>('orders');

  return (
    <div className="w-full bg-[#242424] rounded-[20px] border border-[#404040] overflow-hidden flex flex-col gap-1 p-[18px]">
      {/* Tabs */}
      <div className="flex gap-2 items-center p-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-[#E0E0E0]'
                : 'text-[#E0E0E0]/70 hover:text-[#E0E0E0]'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F06718]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className='p-2'>
        {activeTab === 'orders' && <OpenOrders symbol={symbol} />}
        {activeTab === 'history' && <OrderHistory symbol={symbol} />}
        {activeTab === 'trades' && <TradeHistory symbol={symbol} baseDecimals={baseDecimals} quoteDecimals={quoteDecimals} />}
        {activeTab === 'balances' && <Balances />}
      </div>
    </div>
  );
}

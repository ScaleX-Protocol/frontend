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
    <div className="w-full bg-[#2C2C2C] rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center px-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-4 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-[#E0E0E0]'
                : 'text-[#A0A0A0] hover:text-[#E0E0E0]'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#F06718]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3">
        {activeTab === 'orders' && <OpenOrders symbol={symbol} />}
        {activeTab === 'history' && <OrderHistory symbol={symbol} />}
        {activeTab === 'trades' && <TradeHistory symbol={symbol} baseDecimals={baseDecimals} quoteDecimals={quoteDecimals} />}
        {activeTab === 'balances' && <Balances />}
      </div>
    </div>
  );
}

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

type HistoryTab = 'orders' | 'history' | 'positions';

const TABS: { key: HistoryTab; label: string; count?: number }[] = [
  { key: 'orders', label: 'Open Orders' },
  { key: 'history', label: 'History' },
  { key: 'positions', label: 'Positions' },
];

export default function History({ symbol, baseDecimals, quoteDecimals }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>('orders');

  return (
    <div className="w-full bg-[#0A0A0A] rounded-[16px] border border-[#1F1F1F] overflow-hidden flex flex-col">
      {/* Tabs */}
      <div className="flex items-center px-4 gap-6 border-b border-[#1F1F1F]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 font-medium text-xs leading-[16px] transition-colors relative ${
              activeTab === tab.key
                ? 'text-[#FFFFFF]'
                : 'text-[#666666] hover:text-[#FFFFFF]'
            }`}
          >
            <span className="flex items-center">
              {tab.label}
            </span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F97316]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'orders' && <OpenOrders symbol={symbol} />}
      {activeTab === 'history' && <OrderHistory symbol={symbol} />}
      {activeTab === 'positions' && <Balances />}
    </div>
  );
}

'use client';

import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import SummaryCard from './summary/summaryCard';
import BalanceCard from './balances/balanceCard';
import ActionPanel from './actionPanel/actionPanel';
import PortfolioCard from './detailAsset/portfolio';
import EarnCard from './detailAsset/earn';
import BorrowCard from './detailAsset/borrow';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'none' | 'deposit' | 'withdraw' | 'transfer'>('none');

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <BalanceCard balance="$ 99.999.999" activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="col-span-1">
          <div className="grid grid-cols-2 gap-4">
            <div className={`${activeTab === 'none' ? 'col-span-2' : 'col-span-1'}`}>
              <SummaryCard />
            </div>
            <AnimatePresence mode="popLayout">
              {activeTab !== 'none' && (
                <div className="col-span-1">
                  <ActionPanel
                    activeTab={activeTab as 'deposit' | 'withdraw' | 'transfer'}
                    onClose={() => setActiveTab('none')}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PortfolioCard />
        <EarnCard />
        <BorrowCard />
      </div>
    </div>
  );
}

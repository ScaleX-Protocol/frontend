import Button from '../button';
import { motion } from 'framer-motion';

export default function BalanceCard({
  balance,
  activeTab,
  setActiveTab,
}: {
  balance: string;
  activeTab: string;
  setActiveTab: (tab: 'none' | 'deposit' | 'withdraw' | 'transfer') => void;
}) {
  return (
    <motion.div layout>
      <div className="bg-[#2C2C2C] rounded-md p-2 h-[281px] flex flex-col justify-between">
        <div>
          <div className="text-[#A0A0A0] text-xl font-medium mb-2">Your Balances</div>
          <div className="text-[#E0E0E0] text-5xl font-medium tracking-tight">{balance}</div>
        </div>
        <div className="flex gap-2">
          <Button
            active={activeTab === 'deposit'}
            onClick={() => setActiveTab(activeTab === 'deposit' ? 'none' : 'deposit')}
          >
            Deposit
          </Button>
          <Button
            active={activeTab === 'withdraw'}
            onClick={() => setActiveTab(activeTab === 'withdraw' ? 'none' : 'withdraw')}
          >
            Withdraw
          </Button>
          <Button
            active={activeTab === 'transfer'}
            onClick={() => setActiveTab(activeTab === 'transfer' ? 'none' : 'transfer')}
          >
            Transfer
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

import Button from '../button';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';

interface BalanceCardProps {
  balance: string;
  activeTab: string;
  setActiveTab: (tab: 'none' | 'deposit' | 'withdraw' | 'transfer') => void;
  loading?: boolean;
  error?: Error | null;
}

export default function BalanceCard({
  balance,
  activeTab,
  setActiveTab,
  loading = false,
  error = null,
}: BalanceCardProps) {
  const getBalanceDisplay = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#A0A0A0]" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-20">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <span className="text-red-400 text-sm">Failed to load balance</span>
        </div>
      );
    }

    return <div className="text-[#E0E0E0] text-5xl font-medium tracking-tight">{balance}</div>;
  };

  return (
    <motion.div layout>
      <div className="bg-[#2C2C2C] rounded-md p-2 h-[281px] flex flex-col justify-between">
        <div>
          <div className="text-[#A0A0A0] text-xl font-medium mb-2">Your Balances</div>
          {getBalanceDisplay()}
        </div>
        <div className="flex gap-2">
          <Button
            active={activeTab === 'deposit'}
            onClick={() => setActiveTab(activeTab === 'deposit' ? 'none' : 'deposit')}
            disabled={loading}
          >
            Deposit
          </Button>
          <Button
            active={activeTab === 'withdraw'}
            onClick={() => setActiveTab(activeTab === 'withdraw' ? 'none' : 'withdraw')}
            disabled={loading}
          >
            Withdraw
          </Button>
          <Button
            active={activeTab === 'transfer'}
            onClick={() => setActiveTab(activeTab === 'transfer' ? 'none' : 'transfer')}
            disabled={loading}
          >
            Transfer
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

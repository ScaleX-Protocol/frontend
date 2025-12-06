import { useWalletState } from '@/hooks/useWalletState';
import { motion } from 'framer-motion';
import { Key, LogOut, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { DepositModal } from '../modals/depositModal';
import { WithdrawModal } from '../modals/withdrawModal';

export default function BalanceCard({
  chainId,
  balance,
  refetch,
  currencies,
  currenciesLoading,
}: {
  chainId: number;
  balance: string;
  refetch: () => void;
  currencies: any[];
  currenciesLoading: boolean;
}) {
  const wallet = useWalletState();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <motion.div layout>
      <div className="bg-[#2C2C2C] rounded-md p-4 h-[297px] flex flex-col justify-between">
        <div className="w-full flex flex-row justify-between items-start">
          <div>
            <div className="text-[#A0A0A0] text-xl font-medium mb-2">Your Balances</div>
            <div className="text-[#E0E0E0] text-5xl font-medium tracking-tight">{balance}</div>
          </div>
          {wallet.isConnected && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                className="flex flex-row gap-2 w-fit items-center justify-center px-3 py-2 hover:bg-[#3C3C3C] border border-[#E0E0E0]/20 rounded-md text-xs font-medium transition-colors"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => wallet.export()}
                className="flex flex-row gap-2 w-fit items-center justify-center px-3 py-2 hover:bg-[#3C3C3C] border border-[#E0E0E0]/20 rounded-md text-xs font-medium transition-colors"
              >
                <Key size={16} />
                Export Key
              </button>
              <button
                type="button"
                onClick={() => wallet.logout()}
                className="flex flex-row gap-2 w-fit items-center justify-center px-3 py-2 hover:bg-[#3C3C3C] border border-[#E0E0E0]/20 rounded-md text-xs font-medium transition-colors"
              >
                <LogOut size={16} />
                Disconnect
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type='button'
            className='w-[148px] py-2 rounded-lg text-lg font-medium transition-colors text-[#E0E0E0] bg-[#F06718]/70 hover:bg-[#F06718]/80'
            onClick={() => setDepositOpen(true)}
          >
            Deposit
          </button>
          <button
            type='button'
            className='w-[148px] py-2 rounded-lg text-lg font-medium transition-colors text-[#E0E0E0] bg-[#3C3C3C] hover:bg-[#4C4C4C] '
            onClick={() => setWithdrawOpen(true)}
          >
            Withdraw
          </button>
        </div>
      </div>
      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        currencies={currencies}
        currenciesLoading={currenciesLoading}
        onBalanceUpdate={() => console.log('Balance updated')}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        currencies={currencies}
        currenciesLoading={currenciesLoading}
        onBalanceUpdate={() => console.log('Balance updated')}
      />
    </motion.div>
  );
}

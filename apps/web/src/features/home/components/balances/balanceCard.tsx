import { useWalletState } from '@scalex/service-wallet';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { motion } from 'framer-motion';
import { Key, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { DepositModal } from '../modals/depositModal';
import { WithdrawModal } from '../modals/withdrawModal';

export default function BalanceCard({
  balance,
  refetch,
  currencies,
  currenciesLoading,
}: {
  balance: string;
  refetch: () => void;
  currencies: any[];
  currenciesLoading: boolean;
}) {
  const wallet = useWalletState();
  const logger = useLogger();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <>
      <div className="relative bg-[#242424] border border-[#404040] rounded-[20px] p-6 h-full flex flex-col justify-between overflow-hidden">
        <div className="absolute -right-66 -top-34 w-[500px] h-[500px] rounded-full bg-[#E26B1D]/10 blur-[100px] pointer-events-none" />
        <div className="absolute right-0 top-44 w-[256px] h-[256px] rounded-full bg-[#E26B1D]/5 blur-[80px] pointer-events-none" />
        <div className="w-full flex flex-row justify-between items-start">
          <div>
            <div className="text-[#A0A0A0] text-xl font-medium mb-2">Your Balances</div>
            <div className='flex flex-row gap-3 items-end'>
              <div className="text-[#E0E0E0] text-5xl font-bold tracking-tight">{balance}</div>
              <button
                type="button"
                onClick={() => refetch()}
                className="p-2 h-fit hover:bg-[#3C3C3C] border border-[#E0E0E0]/20 rounded-md text-xs font-medium transition-colors"
              >
                <RefreshCcw size={12} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type='button'
            className='relative w-[148px] py-2.5 rounded-full font-medium transition-all text-white bg-[#E86A25] hover:bg-[#F07830] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_3px_6px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/20 before:to-transparent before:rounded-t-full'
            onClick={() => setDepositOpen(true)}
          >
            <span className='relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]'>Deposit</span>
          </button>
          <button
            type='button'
            className='w-[148px] py-2 rounded-full text-[#E0E0E0] bg-[#3C3C3C] hover:bg-[#4A4A4A] border border-[#383838]'
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
        onBalanceUpdate={() => {
          refetch();
          logger.log(LogLevel.INFO, 'Balance updated after deposit', LogLabel.BALANCE, ServiceName.WEBAPP, {
            walletAddress: wallet.externalWallet.address,
            balance
          }, 'balanceCard.tsx', 'onDepositBalanceUpdate');
        }}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        currencies={currencies}
        currenciesLoading={currenciesLoading}
        onBalanceUpdate={() => {
          refetch();
          logger.log(LogLevel.INFO, 'Balance updated after withdraw', LogLabel.BALANCE, ServiceName.WEBAPP, {
            walletAddress: wallet.externalWallet.address,
            balance
          }, 'balanceCard.tsx', 'onWithdrawBalanceUpdate');
        }}
      />
    </>
  );
}

import { useWalletState } from '@/hooks/useWalletState';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { Eye, EyeOff, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';
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
  const [showBalance, setShowBalance] = useState(true);

  // Extract numeric value for display
  const displayBalance = showBalance ? balance : '••••••';

  return (
    <>
      <div className="relative bg-[#111111] border border-[#222222] rounded-[24px] p-6 h-full flex flex-col gap-2 justify-between overflow-hidden">
        {/* Gradient Glow Effects */}
        <div className="absolute top-[-95px] right-[-50px] w-[192px] h-[192px] rounded-full bg-[#E26B1D]/20 blur-2xl pointer-events-none" />

        <div className='flex flex-col gap-2'>
          <div className="flex items-center gap-2">
            <span className="text-[#888888] text-sm font-medium leading-[20px]">Total Balance</span>
            <button
              type="button"
              onClick={() => refetch()}
              title="Refresh Balance"
              className={`text-[#606060] hover:text-[#FFFFFF] transition-colors ${currenciesLoading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              title="Toggle Balance Visibility"
              className="text-[#606060] hover:text-[#FFFFFF] transition-colors"
            >
              {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
          <div className="flex flex-row gap-1 items-baseline">
            <span className="text-[#FFFFFF] text-[32px] md:text-[48px] leading-[48px] font-semibold letter-spacing-[-2.4px]">{displayBalance}</span>
            <span className="text-[#555555] leading-[24px]">USD</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 md:gap-4 mt-6 relative z-10">
          <button
            type='button'
            className='btn-primary flex-1 items-center justify-center'
            // className='flex-1 h-[48px] rounded-full text-sm font-semibold leading-[20px] transition-all text-white overflow-hidden hover:opacity-90'
            // style={{ background: 'linear-gradient(135deg, #F06718 0%, #F5955D 100%)' }}
            onClick={() => setDepositOpen(true)}
          >
            <span className='relative z-10 flex items-center justify-center gap-2'>
              <ArrowDownCircle size={18} strokeWidth={2} />
              Deposit
            </span>
          </button>
          <button
            type='button'
            className='flex-1 h-[48px] rounded-full text-sm font-semibold leading-[20px] text-[#FFFFFF] bg-[#1A1A1A] border border-[#333333] hover:bg-[#252525] flex items-center justify-center gap-2 transition-colors'
            onClick={() => setWithdrawOpen(true)}
          >
            <ArrowUpCircle size={18} strokeWidth={2} />
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


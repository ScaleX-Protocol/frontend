import { useWalletState } from '@scalex/service-wallet';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { RefreshCcw, ChevronDown, Eye, EyeOff } from 'lucide-react';
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
      <div className="relative bg-[#0F0F0F] border border-[#1A1A1A] rounded-[20px] p-6 h-full flex flex-col justify-between overflow-hidden">
        {/* Gradient Glow Effects */}
        <div className="absolute -right-32 -top-32 w-[300px] h-[300px] rounded-full bg-[#E26B1D]/8 blur-[80px] pointer-events-none" />
        <div className="absolute right-20 top-32 w-[200px] h-[200px] rounded-full bg-[#E26B1D]/5 blur-[60px] pointer-events-none" />

        {/* Header Row */}
        <div className="w-full flex flex-row justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[#606060] text-sm font-medium">Total Balance</span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-[#606060] hover:text-[#A0A0A0] transition-colors"
              >
                {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>

          {/* Currency Dropdown */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] border border-[#252525] rounded-lg text-[#A0A0A0] text-sm hover:bg-[#1A1A1A] transition-colors"
          >
            <span>USD Dollar</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Balance Display */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex flex-row gap-2 items-baseline">
            <span className="text-[#E0E0E0] text-4xl md:text-5xl font-bold tracking-tight">{displayBalance}</span>
            <span className="text-[#606060] text-lg">USD</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="p-1.5 hover:bg-[#1A1A1A] border border-[#252525] rounded-md text-[#606060] hover:text-[#A0A0A0] transition-colors ml-2"
            >
              <RefreshCcw size={12} />
            </button>
          </div>

          {/* Percentage Change */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] text-xs rounded-md font-medium">
              ↗ +0.00%
            </span>
            <span className="text-[#505050] text-xs">vs last month</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type='button'
            className='relative flex-1 py-3 rounded-full font-medium transition-all text-white bg-gradient-to-b from-[#F07830] to-[#D85A15] hover:from-[#F58540] hover:to-[#E86A25] shadow-[0_2px_8px_rgba(240,120,48,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] overflow-hidden'
            onClick={() => setDepositOpen(true)}
          >
            <span className='relative z-10 flex items-center justify-center gap-2'>
              <span className="text-lg">⊕</span>
              Deposit
            </span>
          </button>
          <button
            type='button'
            className='flex-1 py-3 rounded-full text-[#E0E0E0] bg-[#1A1A1A] hover:bg-[#252525] border border-[#303030] flex items-center justify-center gap-2 transition-colors'
            onClick={() => setWithdrawOpen(true)}
          >
            <span className="text-lg">⊖</span>
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


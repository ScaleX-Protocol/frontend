import { useWalletState } from '@scalex/service-wallet';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { ChevronDown, Eye, EyeOff, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react';
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

  // Percentage change (replace with actual data when available)
  const percentageChange = 0.00;
  const isPositive = percentageChange >= 0;

  return (
    <>
      <div className="relative bg-[#161616] border border-[#404040] rounded-[32px] p-8 h-full flex flex-col justify-between overflow-hidden">
        {/* Gradient Glow Effects - Large concentric circles on right */}
        <div className="absolute right-[-200px] top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#E26B1D]/10 blur-[100px] pointer-events-none" />
        <div className="absolute right-[-100px] top-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-[#E26B1D]/10 blur-[80px] pointer-events-none" />

        {/* Header Row */}
        <div className="w-full flex flex-row justify-between items-start mb-4">
          <div className="flex flex-col gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[#888888] text-sm font-medium leading-[20px]">Total Balance</span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-[#606060] hover:text-[#A0A0A0] transition-colors"
              >
                {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
            <div className="flex flex-row gap-2 items-baseline">
              <span className="text-[#FFFFFF] text-5xl md:text-[60px] leading-[48px] md:leading-[60px] font-semibold tracking-tight">{displayBalance}</span>
              <span className="text-[#555555] md:text-lg md:font-light leading-[24px] md:leading-[28px]">USD</span>
            </div>

            {/* Percentage Change */}
            <div className="hidden md:flex items-center gap-2">
              <span className={`px-2 py-0.5 text-sm leading-[20px] rounded-[6px] font-medium flex items-center gap-1 ${
                isPositive 
                  ? 'bg-[#2ECC71]/10 text-[#2ECC71]' 
                  : 'bg-[#E74C3C]/10 text-[#E74C3C]'
              }`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isPositive ? '+' : ''}{percentageChange.toFixed(2)}%
              </span>
              <span className="text-[#555555] text-sm leading-[20px]">vs last month</span>
            </div>
          </div>

          {/* Currency Dropdown */}
          <button
            type="button"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#161616] border border-[#2A2A2A] rounded-full text-[#AAAAAA] text-xs font-medium leading-[16px] hover:bg-[#1A1A1A] transition-colors"
          >
            <span>USD Dollar</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 md:gap-4 pt-6 md:pt-0">
          <button
            type='button'
            className='max-w-[142px] md:max-w-[217px] relative flex-1 py-3 rounded-[16px] md:rounded-full font-semibold text-sm transition-all text-white overflow-hidden hover:opacity-90 border border-[#F6A474]/64'
            style={{ background: 'linear-gradient(90deg, #F06718 0%, #F06718 34%, #F5955D 100%)' }}
            onClick={() => setDepositOpen(true)}
          >
            <span className='relative z-10 flex items-center justify-center gap-2'>
              <ArrowUpCircle size={16} />
              Deposit
            </span>
          </button>
          <button
            type='button'
            className='max-w-[142px] md:max-w-[217px] flex-1 py-3 rounded-[16px] md:rounded-full text-sm font-semibold text-[#FFFFFF] bg-[#1A1A1A] border border-[#333333] hover:bg-[#252525] flex items-center justify-center gap-2 transition-colors'
            onClick={() => setWithdrawOpen(true)}
          >
            <ArrowDownCircle size={16} />
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


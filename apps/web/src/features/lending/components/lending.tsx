'use client';

import { useMemo, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWalletState, ChainConfig, useCurrencies } from '@scalex/service-wallet';
import { useLendingDashboard } from '@scalex/service-lending';
import type { AvailableToBorrow, LendingBorrow, LendingSummary, LendingSupply } from '@scalex/types';
import SummaryCard from './summary/summaryCard';
import AvailableToBorrowTable from './availToBorrow/availableToBorrowTable';
import EarningTable from './earn/earningTable';
import BorrowedTable from './borrow/borrowedTable';
import RepayModal from './modals/repayModal';
import { logger } from '@/utils/prodLogger';

export interface UseCurrenciesParams {
  chainId: number;
  onlyActual?: boolean;
  limit?: number;
}

export interface UseLendingDashboardParams {
  user: string;
  chainId?: number;
}

// Create contextual logger for Lending component
const log = logger.withContext({ component: 'Lending' });

// Content component that uses hooks - only rendered when Privy is ready
function LendingContent() {
  const wallet = useWalletState();
  const [repayOpen, setRepayOpen] = useState(false);

  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;

  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    onlyActual: true,
    limit: 50,
  };

  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies(currenciesParams);

  const availableCurrencies = useMemo(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  const params: UseLendingDashboardParams = {
    user: wallet.embeddedWallet.address,
    // user: '0xc8e6f712902dca8f50b10dd7eb3c89e5a2ed9a2a',
    // chainId: wallet.embeddedWallet.chainId,
  };

  const { data, isLoading, error } = useLendingDashboard(params);

  if (isLoading) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex items-center justify-center">
        <div className="text-gray-400">No lending data available</div>
      </div>
    );
  }

  const supplies: LendingSupply[] = data.supplies;
  const borrows: LendingBorrow[] = data.borrows;
  const availableToBorrow: AvailableToBorrow[] = data.availableToBorrow || [];
  const summary: LendingSummary = data.summary;
  const interestRateParams = data.interestRateParams || [];

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-6 flex flex-col gap-6">
      {/* Top Row: Asset To Borrow + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <AvailableToBorrowTable
          data={availableToBorrow}
          chainId={chainId}
          interestRateParams={interestRateParams}
          summary={summary}
        />
        <SummaryCard data={summary} loading={isLoading} error={error} />
      </div>

      {/* Bottom Row: Borrowed Asset + Earning Asset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040]">
          <span className="text-[#E0E0E0] text-xl font-medium">Borrowed Asset</span>
          <BorrowedTable
            data={borrows}
            isLoading={isLoading}
            error={error}
            onRepayClick={() => setRepayOpen(true)}
          />
        </div>
        <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040]">
          <span className="text-[#E0E0E0] text-xl font-medium">Earning Asset</span>
          <EarningTable data={supplies} isLoading={isLoading} error={error} />
        </div>
      </div>

      <RepayModal
        isOpen={repayOpen}
        onClose={() => setRepayOpen(false)}
        currencies={availableCurrencies}
        currenciesLoading={currenciesLoading}
        onBalanceUpdate={() => log.info('Balance updated')}
        borrows={borrows}
        summary={summary}
      />
    </div>
  );
}

// Wrapper component that checks Privy ready state before rendering
export default function Lending() {
  const { ready } = usePrivy();

  // Don't render until Privy (and WagmiProvider) are ready
  // This prevents wagmi hooks from being called before WagmiProvider is initialized
  if (!ready) {
    return null;
  }

  return <LendingContent />;
}

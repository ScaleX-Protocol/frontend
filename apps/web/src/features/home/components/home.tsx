'use client';

import { useMemo } from 'react';
import { useWalletState, ChainConfig, useCurrencies } from '@scalex/service-wallet';
import { useLendingDashboard } from '@scalex/service-lending';
import SummaryCard from './summary/summaryCard';
import BalanceCard from './balances/balanceCard';
import PortfolioTable from './tables/portfolioTable';
import EarningTable from './tables/earnTable';
import BorrowTable from './tables/borrowTable';

export interface UseCurrenciesParams {
  chainId: number;
  onlyActual?: boolean;
  limit?: number;
}

// Content component that uses hooks - only rendered when Privy is ready
function HomeContent() {
  const wallet = useWalletState();
  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;

  // Get the active wallet address - prefer embedded wallet, fallback to external
  const activeWalletAddress = wallet.embeddedWallet.address !== 'Not Created'
    ? wallet.embeddedWallet.address
    : wallet.externalWallet.address;

  // Query is enabled if we have any valid wallet address
  const isWalletConnected = activeWalletAddress !== 'Not Created' && activeWalletAddress !== 'Not Connected';

  // Debug logging for production troubleshooting
  console.log('[Home] Embedded wallet:', wallet.embeddedWallet.address);
  console.log('[Home] External wallet:', wallet.externalWallet.address);
  console.log('[Home] Active wallet:', activeWalletAddress);
  console.log('[Home] Enabled condition:', isWalletConnected);
  console.log('[Home] ChainId:', chainId);

  const { data: lendingData, isLoading, error, refetch: refetchLendingData } = useLendingDashboard(
    {
      user: activeWalletAddress,
      chainId: chainId
    },
    {
      enabled: isWalletConnected
    }
  );

  // Debug: log lending data response
  console.log('[Home] Lending data:', {
    isLoading,
    hasData: !!lendingData,
    suppliesCount: lendingData?.supplies?.length || 0,
    error: error?.message
  });

  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    onlyActual: true,
    limit: 50,
  };

  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies(currenciesParams);

  const availableCurrencies = useMemo(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-6 flex flex-col gap-6">
      <div className='flex flex-col gap-2 font-inter'>
        <span className='font-semibold text-2xl'>Overview</span>
        <span className='text-[#666666] text-sm font-inter'>Manage your assets and track your performance.</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <BalanceCard
            balance={lendingData?.summary ? `$${parseFloat(lendingData.summary.totalSupplied).toLocaleString()}` : "-"}
            refetch={refetchLendingData}
            currencies={availableCurrencies}
            currenciesLoading={currenciesLoading}
          />
        </div>
        <div className="col-span-1">
          <SummaryCard data={lendingData?.summary} loading={isLoading} error={error} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040]">
          <span className="text-[#E0E0E0] text-xl font-medium">Portfolio Asset</span>
          <PortfolioTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
        </div>
        <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040]">
          <span className="text-[#E0E0E0] text-xl font-medium">Earn Asset</span>
          <EarningTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
        </div>
        <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040]">
          <span className="text-[#E0E0E0] text-xl font-medium">Borrow Asset</span>
          <BorrowTable data={lendingData?.borrows || []} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}

// Wrapper component - Privy ready check is now handled by ProvidersWithOnboarding
export default function Home() {
  return <HomeContent />;
}

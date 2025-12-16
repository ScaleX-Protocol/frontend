'use client';

import { useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
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

  // Debug logging for production troubleshooting
  console.log('[Home] Wallet address:', wallet.embeddedWallet.address);
  console.log('[Home] Enabled condition:', wallet.embeddedWallet.address !== 'Not Created');
  console.log('[Home] ChainId:', chainId);

  const { data: lendingData, isLoading, error, refetch: refetchLendingData } = useLendingDashboard(
    {
      user: wallet.embeddedWallet.address,
      chainId: chainId
    },
    {
      enabled: wallet.embeddedWallet.address !== 'Not Created'
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
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col gap-4">
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
        <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-3 p-4">
          <span className="text-[#E0E0E0] text-lg font-medium">Portfolio Asset</span>
          <PortfolioTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
        </div>
        <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-3 p-4">
          <span className="text-[#E0E0E0] text-lg font-medium">Earn Asset</span>
          <EarningTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
        </div>
        <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-3 p-4">
          <span className="text-[#E0E0E0] text-lg font-medium">Borrow Asset</span>
          <BorrowTable data={lendingData?.borrows || []} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}

// Wrapper component that checks Privy ready state before rendering
export default function Home() {
  const { ready } = usePrivy();

  // Don't render until Privy (and WagmiProvider) are ready
  // This prevents wagmi hooks from being called before WagmiProvider is initialized
  if (!ready) {
    return null;
  }

  return <HomeContent />;
}

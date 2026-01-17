'use client';

import { useMemo, useState } from 'react';
import { useWalletState, ChainConfig, useCurrencies } from '@scalex/service-wallet';
import { useLendingDashboard } from '@scalex/service-lending';

import SummaryCard from './summary/summaryCard';
import BalanceCard from './balances/balanceCard';
import PortfolioTable from './tables/portfolioTable';
import EarningTable from './tables/earnTable';
import BorrowTable from './tables/borrowTable';
import MarketOverviewCard from './mobile/MarketOverviewCard';
import CTACard from './mobile/CTACard';
import { Wallet, TrendingUp, Landmark, MoreHorizontal } from 'lucide-react';

export interface UseCurrenciesParams {
  chainId: number;
  onlyActual?: boolean;
  limit?: number;
}

type TimePeriod = '24h' | 'Week' | 'Month';

// Content component that uses hooks - only rendered when Privy is ready
function HomeContent() {
  const wallet = useWalletState();
  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('24h');

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
    <div className="w-full flex-1 p-5 md:p-8 flex flex-col gap-6">
      {/* Header Section with Title and Time Period Filter */}
      <div className="hidden md:flex md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-semibold text-2xl leading-[32px] text-[#FFFFFF]">Overview</span>
          <span className="text-[#666666] text-sm leading-[20px]">Manage your assets and track your performance.</span>
        </div>

        {/* Time Period Filter - Desktop only */}
        <div className="hidden md:flex items-center bg-[#111111] rounded-full p-1 gap-2 border border-[#222222]">
          {(['24h', 'Week', 'Month'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${timePeriod === period
                  ? 'bg-[#222222] text-[#FFFFFF]'
                  : 'text-[#666666] hover:text-[#A0A0A0]'
                }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        {/* Balance and Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
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

        {/* Asset Tables */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#161616] rounded-[32px] flex flex-col border border-[#404040]">
            <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
              <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">Portfolio Assets</span>
              <button type="button" className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <PortfolioTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
          </div>
          <div className="bg-[#161616] rounded-[32px] flex flex-col border border-[#404040]">
            <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
              <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">Earning Assets</span>
              <button type="button" className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <EarningTable data={lendingData?.supplies || []} isLoading={isLoading} error={error} />
          </div>
          <div className="bg-[#161616] rounded-[32px] flex flex-col border border-[#404040]">
            <div className="flex items-center justify-between p-6 border-b border-[#1F1F1F]">
              <span className="text-[#FFFFFF] text-[16px] leading-[24px] font-semibold">Borrow Assets</span>
              <button type="button" className="bg-[#161616] p-1.5 w-[30px] h-[30px] flex items-center justify-center rounded-[8px] border border-[#222222] text-[#666666] hover:text-[#808080] transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <BorrowTable data={lendingData?.borrows || []} isLoading={isLoading} error={error} />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Balance Card */}
        <BalanceCard
          balance={lendingData?.summary ? `$${parseFloat(lendingData.summary.totalSupplied).toLocaleString()}` : "-"}
          refetch={refetchLendingData}
          currencies={availableCurrencies}
          currenciesLoading={currenciesLoading}
        />

        {/* Market Overview */}
        <MarketOverviewCard data={lendingData?.summary} loading={isLoading} />

        {/* CTA Cards */}
        <CTACard
          icon={<Wallet className="w-5 h-5 text-[#505050]" />}
          title="Start Your Portfolio"
          description="Build your crypto wealth securely. Deposit assets to track performance."
          buttonText="Add Assets"
          onButtonClick={() => { }}
        />
        <CTACard
          icon={<TrendingUp className="w-5 h-5 text-[#505050]" />}
          title="Ready to Earn?"
          description="Supply assets to lending pools and start earning passive APY today."
          buttonText="Start Earning"
          onButtonClick={() => { }}
        />
        <CTACard
          icon={<Landmark className="w-5 h-5 text-[#505050]" />}
          title="Unlock Liquidity"
          description="Get instant liquidity against your collateral without selling your assets."
          buttonText="Borrow Now"
          onButtonClick={() => { }}
        />
      </div>
    </div>
  );
}

// Wrapper component - Privy ready check is now handled by ProvidersWithOnboarding
export default function Home() {
  return <HomeContent />;
}


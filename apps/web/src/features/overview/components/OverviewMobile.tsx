'use client';

import { Wallet, TrendingUp, Landmark } from 'lucide-react';
import BalanceCard from './shared/BalanceCard';
import SummaryCard from './shared/SummaryCard';
import TableEmptyState from './tables/TableEmptyState';
import type { LendingDashboard } from '@scalex/types';

interface OverviewMobileProps {
  lendingData: LendingDashboard | undefined;
  isLoading: boolean;
  error: Error | null;
  refetchLendingData: () => void;
  currencies: any[];
  currenciesLoading: boolean;
}

export default function OverviewMobile({
  lendingData,
  isLoading,
  refetchLendingData,
  currencies,
  currenciesLoading,
}: OverviewMobileProps) {
  const balance = lendingData?.summary 
    ? `$${parseFloat(lendingData.summary.totalSupplied).toLocaleString()}` 
    : '-';

  return (
    <div className="w-full flex-1 p-5 flex flex-col gap-4">
      {/* Balance Card */}
      <BalanceCard
        balance={balance}
        refetch={refetchLendingData}
        currencies={currencies}
        currenciesLoading={currenciesLoading}
      />

      {/* Market Overview - using SummaryCard with mobile variant */}
      <SummaryCard data={lendingData?.summary} loading={isLoading} variant="mobile" />

      {/* CTA Cards using TableEmptyState with card variant */}
      <TableEmptyState
        variant="card"
        icon={<Wallet className="w-5 h-5 text-[#505050]" />}
        title="Start Your Portfolio"
        description="Build your crypto wealth securely. Deposit assets to track performance."
        buttonText="Add Assets"
        onAction={() => {}}
      />
      <TableEmptyState
        variant="card"
        icon={<TrendingUp className="w-5 h-5 text-[#505050]" />}
        title="Ready to Earn?"
        description="Supply assets to lending pools and start earning passive APY today."
        buttonText="Start Earning"
        onAction={() => {}}
      />
      <TableEmptyState
        variant="card"
        icon={<Landmark className="w-5 h-5 text-[#505050]" />}
        title="Unlock Liquidity"
        description="Get instant liquidity against your collateral without selling your assets."
        buttonText="Borrow Now"
        onAction={() => {}}
      />

      {/* Version Footer */}
      <div className="flex justify-center items-center py-4">
        <span className="text-[#666666] text-xs">
          v{import.meta.env.VITE_APP_VERSION || '1.0.1'} • Base Sepolia (Chain ID: 84532)
        </span>
      </div>
    </div>
  );
}


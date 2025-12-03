'use client';

import SummaryCard from './summary/summaryCard';
import BalanceCard from './balances/balanceCard';
import { useLendingDashboard } from '@/features/lending/hooks/useLendingDashboard';
import { useWalletState } from '@/hooks/useWalletState';
import { ChainConfig } from '@/configs/chain';
import PortfolioTable from './tables/portfolioTable';
import EarningTable from './tables/earnTable';
import BorrowTable from './tables/borrowTable';

export default function Home() {
  const wallet = useWalletState();
  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;

  const { data: lendingData, isLoading, error, refetch: refetchLendingData } = useLendingDashboard(
    {
      user: wallet.embeddedWallet.address,
      chainId: chainId
    },
    {
      enabled: wallet.isReady && wallet.embeddedWallet.address !== 'Not Created'
    }
  );

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <BalanceCard
            chainId={chainId}
            balance={lendingData?.summary ? `$${parseFloat(lendingData.summary.totalSupplied).toLocaleString()}` : "-"}
            refetch={refetchLendingData}
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

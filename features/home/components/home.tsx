'use client';

import { AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import SummaryCard from './summary/summaryCard';
import BalanceCard from './balances/balanceCard';
import ActionPanel from './actionPanel/actionPanel';
import PortfolioCard from './detailAsset/portfolio';
import EarnCard from './detailAsset/earn';
import BorrowCard from './detailAsset/borrow';
import { useLendingDashboard } from '@/features/lending/hooks/useLendingDashboard';
import { useCurrencies, type UseCurrenciesParams } from '@/features/faucet/hooks/useCurrencies';
import { useWalletState } from '@/hooks/useWalletState';
import { ChainConfig } from '@/configs/chain';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'none' | 'deposit' | 'withdraw' | 'transfer'>('none');
  const { user, ready } = usePrivy();

  // Get the Privy embedded wallet address, not the external wallet (same logic as ActionPanel)
  const embeddedWalletAddress = useMemo(() => {
    if (!user?.linkedAccounts) return undefined;

    // Find the Privy embedded wallet (not the external wallet)
    const privyEmbeddedAccount = user.linkedAccounts.find(acc =>
      acc.type === 'wallet' && acc.id && (acc as { address?: string }).address !== user.wallet?.address
    );

    if (privyEmbeddedAccount && (privyEmbeddedAccount as { address?: string }).address) {
      return (privyEmbeddedAccount as { address?: string }).address;
    }

    // Fallback to current wallet if no embedded wallet found
    return user.wallet?.address;
  }, [user]);

  // Use wallet state for dynamic chain configuration
  const wallet = useWalletState();
  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;

  // Fetch currencies at home level for all child components
  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    onlyActual: true,
    limit: 50,
  };

  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies(currenciesParams);

  const availableCurrencies = useMemo(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  const { data: lendingData, isLoading, error, refetch: refetchLendingData } = useLendingDashboard(
    {
      user: embeddedWalletAddress || '',
      chainId: chainId
    },
    {
      enabled: ready && !!embeddedWalletAddress // Only fetch when Privy is ready and embedded wallet is available
    }
  );

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <BalanceCard
            balance={lendingData?.summary ? `$${parseFloat(lendingData.summary.totalSupplied).toLocaleString()}` : "$ 99.999.999"}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            loading={isLoading}
            error={error}
          />
        </div>
        <div className="col-span-1">
          <div className="grid grid-cols-2 gap-4">
            <div className={`${activeTab === 'none' ? 'col-span-2' : 'col-span-1'}`}>
              <SummaryCard data={lendingData?.summary} loading={isLoading} error={error} />
            </div>
            <AnimatePresence mode="popLayout">
              {activeTab !== 'none' && (
                <div className="col-span-1">
                  <ActionPanel
                    activeTab={activeTab as 'deposit' | 'withdraw' | 'transfer'}
                    onClose={() => setActiveTab('none')}
                    currencies={availableCurrencies}
                    currenciesLoading={currenciesLoading}
                    onBalanceUpdate={() => refetchLendingData()}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PortfolioCard data={lendingData?.supplies} loading={isLoading} error={error} />
        <EarnCard data={lendingData?.supplies} loading={isLoading} error={error} />
        <BorrowCard data={lendingData?.borrows} loading={isLoading} error={error} />
      </div>
    </div>
  );
}

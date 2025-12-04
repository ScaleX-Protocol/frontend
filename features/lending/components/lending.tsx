'use client';

import { useWalletState } from '@/hooks/useWalletState';
import { type UseLendingDashboardParams, useLendingDashboard } from '../hooks/useLendingDashboard';
import type { AvailableToBorrow, LendingBorrow, LendingSummary, LendingSupply } from '../types/lending.types';
import SummaryCard from './summaryCard';
import AvailableToBorrowTable from './availableToBorrowTable';
import EarningTable from './earningTable';
import BorrowedTable from './borrowedTable';
import { ChainConfig } from '@/configs/chain';

export default function Lending() {
  const wallet = useWalletState();

  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;

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
  const availableToBorrow: AvailableToBorrow[] = data.availableToBorrow;
  const summary: LendingSummary = data.summary;

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-3 p-4">
          <span className="text-[#E0E0E0] text-lg font-medium">Earning Asset</span>
          <EarningTable data={supplies} isLoading={isLoading} error={error} />
        </div>
        <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-3 p-4">
          <span className="text-[#E0E0E0] text-lg font-medium">Borrowed Asset</span>
          <BorrowedTable data={borrows} isLoading={isLoading} error={error} />
        </div>
        <div className="bg-[#2C2C2C] rounded-md flex flex-col gap-3 p-4 h-[297px]">
          <span className="text-[#E0E0E0] text-lg font-medium">Summary</span>
          <SummaryCard data={summary} loading={isLoading} error={error} />
        </div>
      </div>
      <AvailableToBorrowTable data={availableToBorrow} isLoading={isLoading} error={error} chainId={chainId} />
    </div>
  );
}

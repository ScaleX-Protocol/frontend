'use client';

import { useWalletState } from '@/hooks/useWalletState';
import { type UseLendingDashboardParams, useLendingDashboard } from '../hooks/useLendingDashboard';
import type {
  AvailableToBorrow,
  AvailableToSupply,
  LendingBorrow,
  LendingSummary,
  LendingSupply,
} from '../types/lending.types';
import Borrow from './borrow/borrow';
import Earn from './earn/earn';

export default function Lending() {
  const wallet = useWalletState();

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
  const availableToSupply: AvailableToSupply[] = data.availableToSupply;
  const availableToBorrow: AvailableToBorrow[] = data.availableToBorrow;
  const summary: LendingSummary = data.summary;

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-6 px-2">
        <div>
          <span className="text-gray-400 text-xs">Total Supplied</span>
          <p className="text-white text-lg font-semibold">${summary.totalSupplied}</p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Net APY</span>
          <p className="text-green-400 text-lg font-semibold">{summary.netAPY}%</p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Total Borrowed</span>
          <p className="text-white text-lg font-semibold">${summary.totalBorrowed}</p>
        </div>
        <div>
          <span className="text-gray-400 text-xs">Borrowing Power</span>
          <p className="text-white text-lg font-semibold">${summary.borrowingPower}</p>
        </div>
      </div>
      <div className="flex flex-row gap-4 flex-1">
        <Earn supplies={supplies} availableToSupply={availableToSupply} />
        <Borrow borrows={borrows} availableToBorrow={availableToBorrow} healthFactor={summary.healthFactor} />
      </div>
    </div>
  );
}

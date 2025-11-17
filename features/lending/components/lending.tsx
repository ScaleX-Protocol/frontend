import { useWalletState } from '@/hooks/useWalletState';
import Borrow from './borrow/borrow';
import Earn from './earn/earn';
import { useLendingDashboard, type UseLendingDashboardParams } from '../hooks/useLendingDashboard';
import type { AvailableToBorrow, AvailableToSupply, LendingBorrow, LendingSupply } from '../types/lending.types';

export default function Lending() {
  const wallet = useWalletState();

  const params: UseLendingDashboardParams = {
    user: wallet.embeddedWallet.address,
    // chainId: wallet.embeddedWallet.chainId,
  };

  const { data, isLoading, error } = useLendingDashboard(params);

  if (isLoading || error) {
    console.log('error market data');
  }

  // Handle loading or Error
  if (!data) {
    return <div>No lending data available</div>;
  }

  const supplies: LendingSupply[] = data.supplies;
  const borrows: LendingBorrow[] = data.borrows;
  const availableToSupply: AvailableToSupply[] = data.availableToSupply;
  const availableToBorrow: AvailableToBorrow[] = data.availableToBorrow;

  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-row gap-4">
      <Earn supplies={supplies} availableToSupply={availableToSupply} />
      <Borrow borrows={borrows} availableToBorrow={availableToBorrow} />
    </div>
  );
}

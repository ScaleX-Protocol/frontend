import { Search } from 'lucide-react';
import BorrowTable from '../tables/borrowTable';
import { useState } from 'react';
import { useLendingDashboard } from '@/features/lending/hooks/useLendingDashboard';
import { useWalletState } from '@scalex/service-wallet';
import { ChainConfig } from '@/configs/chain';

export default function SheetContentBorrow() {
  const wallet = useWalletState();

  // Always use configured chainId from environment, not wallet's chainId
  const chainId = ChainConfig.defaultChainId;

  const [searchAsset, setSearchAsset] = useState('');

  // Embedded wallet is the protocol wallet — always prefer it for lending queries.
  const activeAddress = wallet.embeddedWallet.address !== 'Not Created'
    ? wallet.embeddedWallet.address
    : wallet.externalWallet.address;

  const {
    data: lendingData,
    isLoading,
    error,
  } = useLendingDashboard(
    {
      user: activeAddress,
      chainId: chainId,
    },
    {
      enabled: wallet.isReady && !!activeAddress && activeAddress !== 'Not Created' && activeAddress !== 'Not Connected',
    },
  );

  const filteredBorrowing = lendingData?.borrows.filter((asset) =>
    asset.asset.toLowerCase().includes(searchAsset.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row gap-2 px-3 py-2 rounded-md border border-[#E0E0E0]/20">
        <Search size={20} className="text-[#E0E0E0]" />
        <input
          type="text"
          placeholder="Search Asset"
          value={searchAsset}
          onChange={(e) => setSearchAsset(e.target.value)}
          className="text-[#E0E0E0] placeholder:text-[#E0E0E0]/70 bg-transparent outline-none"
        />
      </div>
      <BorrowTable data={filteredBorrowing || []} isLoading={isLoading} error={error} />
    </div>
  );
}

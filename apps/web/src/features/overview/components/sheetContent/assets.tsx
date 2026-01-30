import { Search } from 'lucide-react';
import PortfolioTable from '../tables/portfolioTable';
import { useState } from 'react';
import { useLendingDashboard } from '@/features/lending/hooks/useLendingDashboard';
import { useWalletState } from '@scalex/service-wallet';
import { ChainConfig } from '@/configs/chain';

export default function SheetContentAssets() {
  const wallet = useWalletState();

  // Always use configured chainId from environment, not wallet's chainId
  const chainId = ChainConfig.defaultChainId;

  const [searchAsset, setSearchAsset] = useState('');

  const {
    data: lendingData,
    isLoading,
    error,
  } = useLendingDashboard(
    {
      user: wallet.embeddedWallet.address,
      chainId: chainId,
    },
    {
      enabled: wallet.isReady && wallet.embeddedWallet.address !== 'Not Created',
    },
  );

  const filteredAssets = lendingData?.supplies.filter((asset) =>
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
      <PortfolioTable data={filteredAssets || []} isLoading={isLoading} error={error} />
    </div>
  );
}

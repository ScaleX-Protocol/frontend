import { Search } from "lucide-react";
import { useState } from "react";
import { useLendingDashboard } from "@/features/lending/hooks/useLendingDashboard";
import { useWalletState } from "@scalex/service-wallet";
import { ChainConfig } from "@/configs/chain";
import ActivityTable from "../tables/activityTable";

export default function SheetContentHistory() {
  const wallet = useWalletState();
  const chainId = ChainConfig.defaultChainId;
  const [searchHistory, setSearchHistory] = useState('');

  // Embedded wallet is the protocol wallet — always prefer it for protocol queries.
  const activeAddress = wallet.embeddedWallet.address !== 'Not Created'
    ? wallet.embeddedWallet.address
    : wallet.externalWallet.address;

  const { data: lendingData, isLoading, error } = useLendingDashboard(
    { user: activeAddress, chainId },
    {
      enabled: wallet.isReady && !!activeAddress && activeAddress !== 'Not Created' && activeAddress !== 'Not Connected',
    },
  );

  const filteredHistory = (lendingData?.activityHistory ?? []).filter(item =>
    item.token.toLowerCase().includes(searchHistory.toLowerCase()) ||
    item.action.toLowerCase().includes(searchHistory.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row gap-2 px-3 py-2 rounded-md border border-[#E0E0E0]/20">
        <Search size={20} className="text-[#E0E0E0]" />
        <input
          type="text"
          placeholder="Search History"
          value={searchHistory}
          onChange={(e) => setSearchHistory(e.target.value)}
          className="text-[#E0E0E0] placeholder:text-[#E0E0E0]/70 bg-transparent outline-none"
        />
      </div>
      <ActivityTable data={filteredHistory} isLoading={isLoading} error={error} />
    </div>
  );
}

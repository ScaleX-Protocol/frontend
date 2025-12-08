'use client';

import { Copy, Check, Search, Key, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useWalletState } from '@/hooks/useWalletState';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import BorrowTable from './tables/borrowTable';
import PortfolioTable from './tables/portfolioTable';
import { useLendingDashboard } from '@/features/lending/hooks/useLendingDashboard';
import { ChainConfig } from '@/configs/chain';

interface WalletSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = 'assets' | 'borrowing' | 'deposit' | 'withdraw' | 'history';

export default function WalletSheet({ open, onOpenChange }: WalletSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('assets');
  const [searchAsset, setSearchAsset] = useState('');
  const [searchHistory, setSearchHistory] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('10.00');
  const [sendToLoginWallet, setSendToLoginWallet] = useState(true);
  const [withdrawToDifferentWallet, setWithdrawToDifferentWallet] = useState(false);
  const [copied, setCopied] = useState(false);

  const wallet = useWalletState();

  const embeddedAddress = wallet.embeddedWallet.address;
  const externalAddress = wallet.externalWallet.address;
  const loginAddress = embeddedAddress !== 'Not Created' ? embeddedAddress : externalAddress;

  const fullLoginAddress =
    loginAddress && loginAddress !== 'Not Connected' && loginAddress !== 'Not Created' ? loginAddress : '';

  const handleCopy = async () => {
    if (fullLoginAddress) {
      await navigator.clipboard.writeText(fullLoginAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    wallet.logout();
    onOpenChange(false);
  };

  const handleExportKey = async () => {
    wallet.export();
  };

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

  const filteredAssets = lendingData?.supplies.filter((asset) =>
    asset.asset.toLowerCase().includes(searchAsset.toLowerCase()),
  );

  const filteredBorrowing = lendingData?.borrows.filter((asset) =>
    asset.asset.toLowerCase().includes(searchAsset.toLowerCase()),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent onClose={() => onOpenChange(false)} className="p-2">
        <div className="h-full flex flex-col bg-[#2C2C2C] gap-4">
          {/* Header */}
          <h2 className="text-2xl font-bold text-[#E0E0E0]">ScaleX Wallet</h2>
          <div className="w-full border-b border-[#3C3C3C]"></div>
          <div className="flex flex-row items-center justify-between">
            <div className="text-sm text-[#A0A0A0]">Login Method</div>
            <div className="flex items-center gap-2">
              <Image src={wallet.externalWallet.wallet?.meta.icon || ''} alt="Wallet Icon" height={20} width={20} />
              <span className="text-sm text-gray-300">
                {wallet.externalWallet.address.slice(0, 6)}...{wallet.externalWallet.address.slice(-4)}
              </span>
            </div>
          </div>
          <div className="px-3 py-2 w-full flex flex-row justify-between items-center border border-[#E0E0E0]/20 rounded-md">
            {fullLoginAddress && <div className="text-[#E0E0E0] break-all">{fullLoginAddress}</div>}
            <button type="button" onClick={handleCopy} className="p-1 hover:bg-[#3C3C3C] rounded transition-colors">
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-[#A0A0A0]" />}
            </button>
          </div>

          {/* Tabs */}
          <div className="w-full border-b border-[#3C3C3C]"></div>
          <div className="flex justify-between">
            {(['assets', 'borrowing', 'deposit', 'withdraw', 'history'] as TabType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-2 font-medium transition-colors whitespace-nowrap capitalize',
                  activeTab === tab
                    ? 'text-[#F06718]/70 bg-[#E0E0E0]/20 border border-[#E0E0E0]/40'
                    : 'text-[#E0E0E0]/70 hover:text-[#E0E0E0]',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="w-full border-b border-[#3C3C3C]"></div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'assets' && (
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
                <PortfolioTable data={filteredAssets || []} isLoading={isLoading} error={error}/>
              </div>
            )}

            {activeTab === 'borrowing' && (
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
            )}

            {activeTab === 'deposit' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="" className="block text-sm text-[#A0A0A0] mb-2">
                    Amount
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1 bg-[#3C3C3C] border-[#4C4C4C] text-[#E0E0E0] placeholder:text-[#A0A0A0]"
                    />
                    <div className="px-4 py-2 bg-[#3C3C3C] border border-[#4C4C4C] rounded-md text-sm text-[#E0E0E0] flex items-center">
                      USDC
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full py-3 bg-[#F06718] hover:bg-[#f0782a] text-white rounded-md font-medium transition-colors"
                >
                  Deposit
                </button>
              </div>
            )}

            {activeTab === 'withdraw' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="" className="block text-sm text-[#A0A0A0] mb-2">
                    Amount
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="flex-1 bg-[#3C3C3C] border-[#4C4C4C] text-[#E0E0E0] placeholder:text-[#A0A0A0]"
                    />
                    <div className="px-4 py-2 bg-[#3C3C3C] border border-[#4C4C4C] rounded-md text-sm text-[#E0E0E0] flex items-center">
                      USDC
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendToLoginWallet}
                      onChange={(e) => {
                        setSendToLoginWallet(e.target.checked);
                        if (e.target.checked) {
                          setWithdrawToDifferentWallet(false);
                        }
                      }}
                      className="mt-1 w-4 h-4 rounded border-[#4C4C4C] bg-[#3C3C3C] text-[#F06718] focus:ring-[#F06718] focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-[#E0E0E0]">Send to login wallet</div>
                      {sendToLoginWallet && fullLoginAddress && (
                        <div className="text-xs text-[#A0A0A0] font-mono mt-1">
                          {fullLoginAddress.slice(0, 6)}...{fullLoginAddress.slice(-4)}
                        </div>
                      )}
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={withdrawToDifferentWallet}
                      onChange={(e) => {
                        setWithdrawToDifferentWallet(e.target.checked);
                        if (e.target.checked) {
                          setSendToLoginWallet(false);
                        }
                      }}
                      className="mt-1 w-4 h-4 rounded border-[#4C4C4C] bg-[#3C3C3C] text-[#F06718] focus:ring-[#F06718] focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-[#E0E0E0]">Withdraw to a different wallet</span>
                  </label>
                </div>
                <button
                  type="button"
                  className="w-full py-3 bg-[#F06718] hover:bg-[#f0782a] text-white rounded-md font-medium transition-colors"
                >
                  Withdraw
                </button>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <Input
                  placeholder="Search History"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="bg-[#3C3C3C] border-[#4C4C4C] text-[#E0E0E0] placeholder:text-[#A0A0A0]"
                />
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#3C3C3C]">
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#A0A0A0]">Type</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#A0A0A0]">Amount</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#A0A0A0]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="py-8 px-2 text-center text-sm text-[#A0A0A0]">
                          No History Found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="w-full border-b border-[#3C3C3C]"></div>

          <div className="flex gap-2">
            <button
              type="button"
              className="w-full flex gap-2 items-center justify-center p-2 rounded-lg font-medium transition-colors text-[#E0E0E0] bg-[#F06718]/70 hover:bg-[#F06718]/80"
              onClick={handleExportKey}
            >
              <Key size={20} />
              Export Key
            </button>
            <button
              type="button"
              className="p-2 rounded-lg font-medium transition-colors text-[#E0E0E0] bg-[#3C3C3C] hover:bg-[#4C4C4C] "
              onClick={handleDisconnect}
              title="Disconnect"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

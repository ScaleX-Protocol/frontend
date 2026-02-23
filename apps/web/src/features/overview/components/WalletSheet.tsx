'use client';

import { Copy, Check, Key, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useWalletState, ChainTypeConfig } from '@scalex/service-wallet';
import { cn } from '@/lib/utils';
import SheetContentAssets from './sheetContent/assets';
import SheetContentBorrow from './sheetContent/borrow';
import SheetContentDeposit from './sheetContent/deposit';
import SheetContentHistory from './sheetContent/history';
import SheetContentWithdraw from './sheetContent/withdraw';

interface WalletSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = 'assets' | 'borrowing' | 'deposit' | 'withdraw' | 'history';

export default function WalletSheet({ open, onOpenChange }: WalletSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('assets');
  const [copied, setCopied] = useState(false);

  const wallet = useWalletState();

  // Chain-aware wallet address resolution
  const embeddedAddress = ChainTypeConfig.isSolana
    ? wallet.embeddedSolanaWallet.address
    : wallet.embeddedWallet.address;
  const externalAddress = ChainTypeConfig.isSolana
    ? wallet.externalSolanaWallet.address
    : wallet.externalWallet.address;

  const loginAddress = embeddedAddress !== 'Not Created' ? embeddedAddress : externalAddress;
  const fullLoginAddress =
    loginAddress && loginAddress !== 'Not Connected' && loginAddress !== 'Not Created' ? loginAddress : '';

  // Chain-aware wallet icon
  // EVM: wallet?.meta.icon  |  Solana: standardWallet has no meta.icon — use a fallback
  const walletIcon = ChainTypeConfig.isSolana
    ? undefined // Solana embedded wallets don't have an icon URL
    : wallet.externalWallet.wallet?.meta.icon;

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
              {walletIcon ? (
                <img src={walletIcon} alt="Wallet Icon" className="h-5 w-5" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-[8px] text-white font-bold">
                  S
                </div>
              )}
              <span className="text-sm text-gray-300">
                {fullLoginAddress
                  ? ChainTypeConfig.isSolana ? 'SVM' : 'EVM'
                  : 'Not Connected'}
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
            {activeTab === 'assets' && <SheetContentAssets />}

            {activeTab === 'borrowing' && <SheetContentBorrow />}

            {activeTab === 'deposit' && <SheetContentDeposit />}

            {activeTab === 'withdraw' && <SheetContentWithdraw />}

            {activeTab === 'history' && <SheetContentHistory />}
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

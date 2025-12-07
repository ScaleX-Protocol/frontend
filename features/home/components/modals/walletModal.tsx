import ModalWrapper from '@/components/modals/modalWrapper';
import { useWalletState } from '@/hooks/useWalletState';
import type { BaseModalProps } from '@/types/modal.types';
import { Check, Copy, Key, LogOut, Wallet } from 'lucide-react';
import { useState } from 'react';

export default function WalletModal({ isOpen, onClose }: BaseModalProps) {
  const [copiedAddress, setCopiedAddress] = useState<'login' | 'embedded' | null>(null);

  const wallet = useWalletState();

  const loginAddress = wallet.externalWallet.address;
  const embeddedAddress = wallet.embeddedWallet.address;

  const handleExportKey = () => {
    wallet.export();
  };

  const handleDisconnect = () => {
    wallet.logout();
    onClose();
  };

  const handleCopy = async (address: string, type: 'login' | 'embedded') => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
      // Fallback for older browsers
      fallbackCopy(address);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      setCopiedAddress('login'); // Generic fallback
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }

    document.body.removeChild(textArea);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Wallet" icon={Wallet}>
      <div className="px-6 py-5 space-y-4">
        <div className="space-y-2">
          <label htmlFor="" className="text-[#A0A0A0] text-sm font-medium">
            Login Address
          </label>
          <div className="relative">
            <div className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] font-mono text-sm pr-12 overflow-hidden">
              <div className="truncate">{loginAddress}</div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(loginAddress, 'login')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[#3A3A3A] rounded transition-colors"
              title="Copy address"
              aria-label="Copy login address"
            >
              {copiedAddress === 'login' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-[#A0A0A0]" />
              )}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="" className="text-[#A0A0A0] text-sm font-medium">
            Embedded Address
          </label>
          <div className="relative">
            <div className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] font-mono text-sm pr-12 overflow-hidden">
              <div className="truncate">{embeddedAddress}</div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(embeddedAddress, 'embedded')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[#3A3A3A] rounded transition-colors"
              title="Copy address"
              aria-label="Copy embedded address"
            >
              {copiedAddress === 'embedded' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-[#A0A0A0]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#252525] flex gap-3">
        <button
          type="button"
          onClick={handleExportKey}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#F06718] hover:bg-[#FF7A2F] text-white font-medium rounded-lg transition-colors"
        >
          <Key className="w-4 h-4" />
          Export Key
        </button>
        <button
          type="button"
          onClick={handleDisconnect}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#F06718] hover:bg-[#FF7A2F] text-white font-medium rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    </ModalWrapper>
  );
}

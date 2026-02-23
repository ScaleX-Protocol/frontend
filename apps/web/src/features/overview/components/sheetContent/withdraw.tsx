import { Button, Input, StatusMessage } from '@/components/modals/modalComponents';
import { ChainConfig } from '@/configs/chain';
import { useCurrencies } from '@scalex/api';
import { useWalletState } from '@/hooks/useWalletState';
import type { Token } from '@/types/modal.types';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function SheetContentWithdraw() {
  // Wallet State And Chain Id
  const wallet = useWalletState();

  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies();

  const availableCurrencies = useMemo(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  // Token Data
  const availableTokens = useMemo(() => {
    return transformCurrenciesToTokens(availableCurrencies);
  }, [availableCurrencies]);

  const [selectedToken, setSelectedToken] = useState<Token>(() => {
    return (
      availableTokens[1] || {
        address: '0x036CbD53842c5426634d7926b90d857C835a21FB',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      }
    );
  });

  // Amount State
  const [amount, setAmount] = useState('');

  // Mock withdraw handle
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Note: Form reset logic removed - it was incorrectly placed outside useEffect
  // causing the form to reset on every render. If you need reset logic,
  // move it to a proper useEffect or call it explicitly after actions.

  const handleWithdraw = async () => {
    if (!wallet.isReady || !wallet.embeddedWallet.address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      setCurrentStep('processing');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setIsConfirmed(true);
      setCurrentStep('idle');
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
      setCurrentStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled =
    !wallet.isReady ||
    !wallet.embeddedWallet.address ||
    !amount ||
    parseFloat(amount) <= 0 ||
    isProcessing ||
    currenciesLoading;

  return (
    <div className="space-y-4">
      {/* Token Selection */}
      <div>
        <label htmlFor="token-select" className="text-[#A0A0A0] text-sm block mb-2">
          Select Asset
        </label>
        <select
          id="token-select"
          value={selectedToken.symbol}
          onChange={(e) => {
            const token = availableTokens.find((t) => t.symbol === e.target.value);
            if (token) setSelectedToken(token);
          }}
          className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
          disabled={isProcessing || currenciesLoading}
        >
          {currenciesLoading ? (
            <option disabled>Loading tokens...</option>
          ) : availableTokens.length === 0 ? (
            <option disabled>No tokens available</option>
          ) : (
            availableTokens.map((token) => (
              <option key={token.address} value={token.symbol}>
                {token.name} ({token.symbol})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Available Balance Display */}
      <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#E0E0E0]/10">
        <div className="flex justify-between items-center">
          <span className="text-[#A0A0A0] text-sm">Available to Withdraw</span>
          <span className="text-[#E0E0E0] font-medium">1,250.00 {selectedToken.symbol}</span>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="text-[#A0A0A0] text-sm block mb-2">Amount</label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            // Allow empty, numbers, and decimal point
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              setAmount(value);
            }
          }}
          disabled={isProcessing}
          className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Withdraw Info */}
      <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#E0E0E0]/10">
        <p className="text-[#A0A0A0] text-xs">
          Withdrawing will transfer assets from the protocol back to your wallet.
        </p>
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {error && <StatusMessage type="error" title="Withdrawal Failed" message={error} />}

        {currentStep === 'processing' && (
          <StatusMessage type="loading-process" title="Processing Withdrawal" message="Please confirm in your wallet" />
        )}

        {isConfirmed && (
          <StatusMessage type="success" title="Withdrawal Confirmed!" message="Your assets have been withdrawn" />
        )}
      </AnimatePresence>

      {/* Withdraw Button */}
      <div className="py-4 border-t border-[#3A3A3A]">
        <Button onClick={handleWithdraw} disabled={isDisabled} variant="primary">
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            `Withdraw`
          )}
        </Button>
      </div>
    </div>
  );
}

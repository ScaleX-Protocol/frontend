import { useEffect, useMemo, useState } from 'react';
import { ArrowUpFromLine, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useWalletState } from '@/hooks/useWalletState';
import ModalWrapper from '@/components/modals/modalWrapper';
import { Button, Input, StatusMessage } from '@/components/modals/modalComponents';
import type { BaseModalProps, Token } from '@/types/modal.types';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';

export function WithdrawModal({
  isOpen,
  onClose,
  currencies = [],
  currenciesLoading = false,
  onBalanceUpdate,
}: BaseModalProps) {
  const wallet = useWalletState();
  const address = wallet.embeddedWallet.address;
  const ready = wallet.isReady;

  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const availableTokens = useMemo(() => {
    return transformCurrenciesToTokens(currencies);
  }, [currencies]);

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

  useEffect(() => {
    if (availableTokens.length > 1 && !selectedToken.address) {
      setSelectedToken(availableTokens[1]);
    }
  }, [availableTokens, selectedToken.address]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setAmount('');
        setError(null);
        setIsConfirmed(false);
        setCurrentStep('idle');
      }, 300);
    }
  }, [isOpen]);

  const handleWithdraw = async () => {
    if (!ready || !address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      setCurrentStep('processing');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setIsConfirmed(true);
      setCurrentStep('idle');

      if (onBalanceUpdate) {
        onBalanceUpdate();
      }

      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
      setCurrentStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = !ready || !address || !amount || parseFloat(amount) <= 0 || isProcessing || currenciesLoading;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw Assets"
      icon={ArrowUpFromLine}
      isProcessing={isProcessing}
    >
      {/* Content */}
      <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-240px)] overflow-y-auto">
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
        <Input
          label="Amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e: any) => setAmount(e.target.value)}
          disabled={isProcessing}
          step="any"
          min="0"
        />

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
            <StatusMessage
              type="loading-process"
              title="Processing Withdrawal"
              message="Please confirm in your wallet"
            />
          )}

          {isConfirmed && (
            <StatusMessage type="success" title="Withdrawal Confirmed!" message="Your assets have been withdrawn" />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#252525]">
        {!wallet.isConnected ? (
          <Button onClick={() => wallet.login()} variant="primary">
            Connect Wallet
          </Button>
        ) : (
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
        )}
      </div>
    </ModalWrapper>
  );
}

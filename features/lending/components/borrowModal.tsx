import { Button, StatusMessage } from '@/components/modals/modalComponents';
import ModalWrapper from '@/components/modals/modalWrapper';
import type { BaseModalProps, Token } from '@/types/modal.types';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';
import { AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function BorrowModal({
  isOpen,
  onClose,
  currencies = [],
  currenciesLoading = false,
  onBalanceUpdate,
}: BaseModalProps) {
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const ready = true;

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
    if (isOpen) {
      setAmount('');
      setError(null);
      setIsConfirmed(false);
      setCurrentStep('idle');
      setIsProcessing(false);
    } else {
      setTimeout(() => {
        setAmount('');
        setError(null);
        setIsConfirmed(false);
        setCurrentStep('idle');
        setIsProcessing(false);
      }, 300);
    }
  }, [isOpen]);

  const handleBorrow = async () => {
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
      setError(err.message || 'Borrow failed');
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
      title="Borrow USDC"
      icon={ArrowUpFromLine}
      isProcessing={isProcessing}
    >
      <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-240px)] overflow-y-auto">
        {/* Amount Input with Token Display */}
        <div>
          <label htmlFor="" className="text-[#A0A0A0] text-sm block mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing}
              step="any"
              min="0"
              className="w-full px-4 py-3 pr-24 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <div className="w-6 h-6 rounded-full bg-[#2775CA] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">$</span>
              </div>
              <span className="text-[#E0E0E0] font-medium">{selectedToken.symbol}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[#A0A0A0] text-xs">$ 0</span>
            <button
              type="button"
              onClick={() => setAmount('0.0252260')}
              className="text-[#F06718] text-xs font-medium hover:text-[#D85A14] transition-colors"
              disabled={isProcessing}
            >
              Available 0.0252260 MAX
            </button>
          </div>
        </div>

        {/* Transaction Overview */}
        <div className="space-y-3">
          <h4 className="text-[#E0E0E0] text-sm font-medium">Transaction overview</h4>

          <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#E0E0E0]/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#A0A0A0] text-sm">Health factor</span>
              <span className="text-[#E0E0E0] font-medium">∞</span>
            </div>
            <div className="text-right">
              <span className="text-[#A0A0A0] text-xs">Liquidation at &lt;1.0</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-blue-400 text-xs leading-relaxed">
                  <span className="font-medium">Attention:</span> Parameter changes via governance can alter your
                  account health factor and risk of liquidation. Follow the{' '}
                  <a href="#" className="underline hover:text-blue-300">
                    Aave governance forum
                  </a>{' '}
                  for updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {error && <StatusMessage type="error" title="Borrow Failed" message={error} />}

          {currentStep === 'processing' && (
            <StatusMessage type="loading-process" title="Processing Borrow" message="Please confirm in your wallet" />
          )}

          {isConfirmed && (
            <StatusMessage type="success" title="Borrow Confirmed!" message="Assets have been borrowed" />
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#252525]">
        <Button onClick={handleBorrow} disabled={isDisabled} variant="primary">
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            'Enter an amount'
          )}
        </Button>
      </div>
    </ModalWrapper>
  );
}

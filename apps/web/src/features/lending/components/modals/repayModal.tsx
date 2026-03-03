import { Button, StatusMessage } from '@/components/modals/modalComponents';
import ModalWrapper from '@/components/modals/modalWrapper';
import type { BaseModalProps } from '@/types/modal.types';
import type { LendingBorrow, LendingSummary } from '../../types/lending.types';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';
import { formatTokenAmount } from '@/utils/repayUtils';
import { useChainRepay, RepayStep, SolanaRepayStep } from '../../hooks/useChainRepay';
import { useWalletState } from '@scalex/service-wallet';
import { useLogger } from '@/hooks/useLogger';
import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { ChainTypeConfig } from '@/configs/chainType';
import { AnimatePresence } from 'framer-motion';
import { useTokenPrices } from '../../hooks/useTokenPrices';

import { DollarSign, Loader2, ChevronDown, Infinity as InfinityIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getBlockExplorerTxUrl } from '@/configs/chain';

// Extended props for RepayModal
interface RepayModalProps extends BaseModalProps {
  borrows?: LendingBorrow[];
  summary?: LendingSummary | null;
}

export default function RepayModal({
  isOpen,
  onClose,
  currencies = [],
  currenciesLoading = false,
  onBalanceUpdate,
  borrows = [],
  summary = null,
}: RepayModalProps) {
  const wallet = useWalletState();
  const logger = useLogger();

  // Embedded wallet is the protocol wallet — always use it for lending actions
  const address = wallet.embeddedWallet.address !== 'Not Created'
    ? wallet.embeddedWallet.address
    : wallet.externalWallet.address;

  const [amount, setAmount] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const availableTokens = useMemo(() => {
    return transformCurrenciesToTokens(currencies);
  }, [currencies]);

  // Store selected index instead of token object for better reactivity
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(1);

  // Derive selected token from index - auto-updates when tokens change
  const selectedToken = useMemo(() => {
    return availableTokens[selectedTokenIndex] ||
      availableTokens[0] ||
    {
      address: '0x036CbD53842c5426634d7926b90d857C835a21FB',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    };
  }, [availableTokens, selectedTokenIndex]);

  // Reset to first non-ETH token when modal opens (only on initial open, not on data refresh)
  useEffect(() => {
    if (isOpen && availableTokens.length > 1) {
      logger.log(LogLevel.INFO, 'Repay modal opened', LogLabel.USER, ServiceName.WEBAPP, {
        availableTokens: availableTokens.length,
        walletAddress: address
      }, 'repayModal.tsx', 'useEffect');
      setSelectedTokenIndex(1);
    }
    // Only run when modal opens, not when availableTokens changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSliderValue(0);
    } else {
      setTimeout(() => {
        setAmount('');
        setSliderValue(0);
      }, 300);
    }
  }, [isOpen]);

  const {
    repay,
    isPending: isRepaying,
    error: repayError,
    currentStep,
  } = useChainRepay({
    onSuccess: (hash) => {
      logger.log(LogLevel.INFO, 'Repay transaction successful', LogLabel.USER, ServiceName.WEBAPP, {
        txHash: hash,
        source: 'repay_modal'
      }, 'repayModal.tsx', 'handleSuccess');

      setTransactionHash(hash);
      setAmount('');
      setSliderValue(0);

      if (onBalanceUpdate) {
        onBalanceUpdate();
      }

      setTimeout(() => setTransactionHash(null), 10000);
      setTimeout(() => onClose(), 3000);
    },
    onError: (error) => {
      logger.logError('Repay transaction failed', {
        error: error.message || error,
        source: 'repay_modal'
      }, 'handleError', 'repayModal.tsx');
    },
  });

  const { getUsdValue } = useTokenPrices();

  // Get user balance for selected token
  const { data: balance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: ChainTypeConfig.isEVM && !!address && !!selectedToken.address,
      retry: 3,
      retryDelay: 1000,
    }
  });

  // Get balance as number for slider
  const balanceNumber = balance ? parseFloat(formatTokenAmount(balance, selectedToken.decimals)) : 0;

  // Handle slider change
  const handleSliderChange = (percentage: number) => {
    setSliderValue(percentage);
    if (balanceNumber > 0) {
      const newAmount = (balanceNumber * percentage / 100);
      const formattedAmount = newAmount.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
      setAmount(formattedAmount);
    }
  };

  const handleRepay = async () => {
    if (!wallet.isReady || !address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      await repay({
        tokenAddress: selectedToken.address,
        tokenSymbol: selectedToken.symbol,
        amount,
        decimals: selectedToken.decimals,
      });
    } catch (err: unknown) {
      console.error('Repay failed:', err);
    }
  };

  // Get borrowed amount for selected token from borrows data
  const currentBorrow = useMemo(() => {
    return borrows.find(b =>
      b.asset === selectedToken.symbol ||
      b.assetAddress.toLowerCase() === selectedToken.address.toLowerCase()
    );
  }, [borrows, selectedToken]);

  // Use real data from props, fallback to defaults
  const borrowedAmount = currentBorrow?.borrowedAmount || '0';
  const healthFactor = summary?.healthFactor || '∞';
  const ltvLiqLtv = currentBorrow
    ? `${currentBorrow.collateralRatio}% / 86%`
    : '0% / 86%';

  const isDisabled = !wallet.isReady || !address || !amount || parseFloat(amount) <= 0 || isRepaying || currenciesLoading;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Repay Borrowed Assets"
      icon={DollarSign}
      isProcessing={isRepaying}
    >
      {/* Content */}
      <div className="px-6 py-5 space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
        {/* Token Selection */}
        <div>
          <label htmlFor="token-select" className="text-[#A0A0A0] text-sm block mb-2">
            Select Asset
          </label>
          <div className="relative">
            <select
              id="token-select"
              value={selectedToken.symbol}
              onChange={(e) => {
                const index = availableTokens.findIndex((t) => t.symbol === e.target.value);
                if (index !== -1) setSelectedTokenIndex(index);
              }}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-[10px] text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
              disabled={isRepaying || currenciesLoading}
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
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="w-5 h-5 text-[#A3A3A3]" />
            </div>
          </div>
        </div>

        {/* Borrowed Amount Display */}
        <div>
          <label className="text-[#A0A0A0] text-sm block mb-2">Borrowed</label>
          <div className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-[10px]">
            <div className="text-[#E0E0E0] font-medium">{borrowedAmount} {selectedToken.symbol}</div>
            <div className="text-[#666666] text-sm">{getUsdValue(borrowedAmount, selectedToken.symbol)}</div>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-[#A0A0A0] text-sm block mb-2">Amount</label>
          <div className="relative bg-[#1A1A1A] border border-[#F06718] rounded-[10px] px-4 py-3">
            <div className="flex items-center justify-between">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setAmount(value);
                    // Update slider
                    if (balanceNumber > 0) {
                      const percentage = (parseFloat(value || '0') / balanceNumber) * 100;
                      setSliderValue(Math.min(100, percentage));
                    }
                  }
                }}
                disabled={isRepaying}
                className="flex-1 bg-transparent text-[#E0E0E0] text-lg font-medium placeholder-[#666666] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-[#E0E0E0] font-medium">{selectedToken.symbol}</span>
            </div>
            <div className="text-[#666666] text-sm mt-1">
              {getUsdValue(amount, selectedToken.symbol)}
            </div>
          </div>
        </div>

        {/* Balance with Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#777777] text-sm">Balance</span>
            <div className="flex items-center gap-2">
              <span className="text-[#E0E0E0] text-sm font-medium">
                {balance ? formatTokenAmount(balance, selectedToken.decimals) : '0'} {selectedToken.symbol}
              </span>
              <span className="text-[#777777] text-sm">
                {balance ? getUsdValue(formatTokenAmount(balance, selectedToken.decimals), selectedToken.symbol) : '$ 0.00'}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="flex flex-col gap-1">
            <div className="relative h-6 flex items-center">
              <div className="absolute w-full h-[2px] bg-[#4A4A4A] top-1/2 -translate-y-1/2 rounded-full pointer-events-none" />
              <div
                className="absolute h-[2px] bg-[#F06718] top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{ width: `${sliderValue}%` }}
              />
              <div className="absolute w-full flex justify-between px-[2px] top-1/2 -translate-y-1/2 pointer-events-none z-1">
                {[0, 25, 50, 75, 100].map((step) => (
                  <div
                    key={step}
                    className={`w-2.5 h-2.5 rounded-full border-2 ${sliderValue >= step ? 'bg-[#F06718] border-[#F06718]' : 'bg-[#4A4A4A] border-[#2A2A2A]'
                      }`}
                  />
                ))}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={sliderValue}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                disabled={isRepaying || !balance}
                className="relative w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed z-10
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F06718]
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-[#F06718]
                  [&::-moz-range-thumb]:cursor-pointer"
                style={{ background: 'transparent', height: '4px' }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#E0E0E0]/70">
              <span>0</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#777777] text-sm">Health Factor</span>
            <div className="flex items-center gap-2">
              <InfinityIcon className="w-4 h-4 text-[#A3A3A3]" />
              <span className="text-[#A3A3A3]">→</span>
              <span className="text-[#2ECC71] text-sm">{healthFactor}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#777777] text-sm">LTV / Liq. LTV</span>
            <span className="text-[#E0E0E0] text-sm">{ltvLiqLtv}</span>
          </div>
        </div>

        {/* Repay Info */}
        <div className="p-3 rounded-[10px] bg-[#1A1A1A] border border-[#E0E0E0]/10">
          <p className="text-[#A0A0A0] text-xs leading-relaxed">
            Repaying will reduce your borrowed balance and improve your Loan-to-Value (LTV) ratio. You can repay partially or in full.
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {currentStep === RepayStep.CHECKING_ALLOWANCE && (
            <StatusMessage type="loading-approve" title="Checking Allowance" message="Please wait..." />
          )}

          {currentStep === RepayStep.APPROVING && (
            <StatusMessage type="loading-approve" title="Approving Token" message="Please confirm in your wallet" />
          )}

          {(currentStep === RepayStep.REPAYING || currentStep === SolanaRepayStep.REPAYING) && (
            <StatusMessage type="loading-process" title="Processing Repayment" message="Please confirm in your wallet" />
          )}

          {currentStep === RepayStep.CONFIRMING && (
            <StatusMessage type="loading-process" title="Confirming Transaction" message="Waiting for confirmation..." />
          )}

          {currentStep === RepayStep.SYNCING && (
            <StatusMessage type="loading-process" title="Syncing Indexer" message="Waiting for balance to update..." />
          )}

          {currentStep === RepayStep.COMPLETED && (
            <StatusMessage type="success" title="Repayment Confirmed!" message="Your debt has been repaid" />
          )}

          {currentStep === RepayStep.ERROR && repayError && (
            <StatusMessage type="error" title="Repayment Failed" message={repayError.message} />
          )}
        </AnimatePresence>

        {/* Transaction Success */}
        {transactionHash && (
          <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/20">
            <div className="flex flex-col gap-1 text-green-400">
              <span className="text-sm font-medium">✓ Transaction Successful!</span>
              <a
                href={getBlockExplorerTxUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-300 hover:text-green-200 underline break-all"
              >
                {transactionHash}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#252525]">
        {!wallet.isConnected ? (
          <Button onClick={() => wallet.login()} variant="primary">
            Connect Wallet
          </Button>
        ) : (
          <button
            type="button"
            onClick={handleRepay}
            disabled={isDisabled}
            className="relative w-full py-3 rounded-full font-medium transition-all text-white bg-[#E86A25] hover:bg-[#F07830] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_3px_6px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/20 before:to-transparent before:rounded-t-full"
          >
            <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2">
              {isRepaying && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRepaying ? (
                currentStep === RepayStep.APPROVING ? 'Approving...' :
                  currentStep === RepayStep.SYNCING ? 'Syncing...' : 'Processing...'
              ) : (
                'Repay'
              )}
            </span>
          </button>
        )}
      </div>
    </ModalWrapper>
  );
}

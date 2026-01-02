import { Button, StatusMessage } from '@/components/modals/modalComponents';
import ModalWrapper from '@/components/modals/modalWrapper';
import type { BaseModalProps } from '@/types/modal.types';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';
import { formatTokenAmount } from '@/utils/borrowUtils';
import { useBorrow, BorrowStep } from '../hooks/useBorrow';
import { useWalletState } from '@scalex/service-wallet';
import { useLogger } from '@/hooks/useLogger';
import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { logger } from '@/utils/prodLogger';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpFromLine, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getBlockExplorerTxUrl } from '@/configs/chain';

// Create contextual logger for BorrowModal component
const log = logger.withContext({ component: 'BorrowModal' });

export default function BorrowModal({
  isOpen,
  onClose,
  currencies = [],
  currenciesLoading = false,
  onBalanceUpdate,
}: BaseModalProps) {
  const wallet = useWalletState();
  const logger = useLogger();

  const address = wallet.externalWallet.address;

  const [amount, setAmount] = useState('');
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

  // Reset to first non-ETH token when modal opens
  useEffect(() => {
    if (isOpen && availableTokens.length > 1) {
      logger.log(LogLevel.INFO, 'Borrow modal opened', LogLabel.USER, ServiceName.WEBAPP, {
        availableTokens: availableTokens.length,
        walletAddress: address
      }, 'borrowModal.tsx', 'useEffect');
      setSelectedTokenIndex(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
    } else {
      setTimeout(() => {
        setAmount('');
      }, 300);
    }
  }, [isOpen]);

  const {
    borrow,
    isPending: isBorrowing,
    error: borrowError,
    currentStep,
  } = useBorrow({
    onSuccess: (hash) => {
      logger.log(LogLevel.INFO, 'Borrow transaction successful', LogLabel.USER, ServiceName.WEBAPP, {
        txHash: hash,
        source: 'borrow_modal'
      }, 'borrowModal.tsx', 'handleSuccess');

      // Store transaction hash for display
      setTransactionHash(hash);

      // Reset form on success
      setAmount('');

      // Refetch balance data to show updated balance
      if (onBalanceUpdate) {
        logger.log(LogLevel.INFO, 'Refetching balance data after successful borrow', LogLabel.USER, ServiceName.WEBAPP, {
          txHash: hash
        }, 'borrowModal.tsx', 'handleSuccess');
        onBalanceUpdate();
      }

      // Clear transaction hash after 10 seconds
      setTimeout(() => setTransactionHash(null), 10000);

      // Optional: close modal after success
      setTimeout(() => onClose(), 3000);
    },
    onError: (error) => {
      logger.logError('Borrow transaction failed', {
        error: error.message || error,
        source: 'borrow_modal'
      }, 'handleError', 'borrowModal.tsx');
    },
  });

  // Get user balance for selected token using proper hook at top level
  const { data: balance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!selectedToken.address,
      retry: 3,
      retryDelay: 1000,
    }
  });

  // Log parameters for debugging
  log.info('Balance Fetch Parameters', {
    userAddress: address,
    tokenAddress: selectedToken.address,
    tokenSymbol: selectedToken.symbol,
    tokenDecimals: selectedToken.decimals,
  });

  // Log balance result
  log.info('Balance Query Result', {
    balance: balance?.toString(),
    formattedBalance: balance ? formatTokenAmount(balance, selectedToken.decimals) : 'N/A',
  });

  const handleBorrow = async () => {
    if (!wallet.isReady || !address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      await borrow({
        tokenAddress: selectedToken.address,
        amount,
        decimals: selectedToken.decimals,
      });
    } catch (error) {
      console.error('Borrow failed:', error);
    } finally {
      // Reset loading state if needed
    }
  };

  const isDisabled = !wallet.isReady || !address || !amount || parseFloat(amount) <= 0 || isBorrowing || currenciesLoading;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Borrow Assets"
      icon={ArrowUpFromLine}
      isProcessing={isBorrowing}
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
              const index = availableTokens.findIndex((t) => t.symbol === e.target.value);
              if (index !== -1) setSelectedTokenIndex(index);
            }}
            className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
            disabled={isBorrowing || currenciesLoading}
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

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[#A0A0A0] text-sm">Amount</label>
            {balance && (
              <button
                type="button"
                onClick={() => setAmount(formatTokenAmount(balance, selectedToken.decimals))}
                className="text-xs text-[#F06718] hover:text-[#FF7A2F] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isBorrowing}
              >
                Max
              </button>
            )}
          </div>
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
            disabled={isBorrowing}
            className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {balance !== undefined && balance !== null ? (
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-[#A0A0A0]">Available balance:</span>
              <span className="font-medium text-[#E0E0E0]">
                {formatTokenAmount(balance, selectedToken.decimals)} {selectedToken.symbol}
              </span>
            </div>
          ) : (
            <p className="text-sm text-[#666666] mt-2">Loading balance...</p>
          )}
        </div>

        {/* Borrow Info */}
        <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#E0E0E0]/10">
          <p className="text-[#A0A0A0] text-xs">
            Borrowing assets will transfer them from the lending protocol to your wallet. You will need to maintain sufficient collateral to avoid liquidation.
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {currentStep === BorrowStep.VALIDATING && (
            <StatusMessage type="loading-approve" title="Validating" message="Please wait..." />
          )}

          {currentStep === BorrowStep.BORROWING && (
            <StatusMessage type="loading-process" title="Processing Borrow" message="Please confirm in your wallet" />
          )}

          {currentStep === BorrowStep.CONFIRMING && (
            <StatusMessage type="loading-process" title="Confirming Transaction" message="Waiting for confirmation..." />
          )}

          {currentStep === BorrowStep.COMPLETED && (
            <StatusMessage type="success" title="Borrow Confirmed!" message="Your assets have been borrowed" />
          )}

          {currentStep === BorrowStep.ERROR && borrowError && (
            <StatusMessage type="error" title="Borrow Failed" message={borrowError.message} />
          )}
        </AnimatePresence>

        {/* Transaction Success */}
        {transactionHash && (
          <div className="p-2 rounded bg-green-900/20 border border-green-500/20 mt-4">
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
          <Button onClick={handleBorrow} disabled={isDisabled} variant="primary">
            {isBorrowing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentStep === BorrowStep.VALIDATING && 'Validating...'}
                {currentStep === BorrowStep.BORROWING && 'Processing...'}
              </span>
            ) : (
              `Borrow`
            )}
          </Button>
        )}
      </div>
    </ModalWrapper>
  );
}

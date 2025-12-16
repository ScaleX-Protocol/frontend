import { Button, StatusMessage } from '@/components/modals/modalComponents';
import ModalWrapper from '@/components/modals/modalWrapper';
import type { BaseModalProps } from '@/types/modal.types';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';
import { formatTokenAmount } from '@/utils/repayUtils';
import { useRepay, RepayStep } from '../hooks/useRepay';
import { useWalletState } from '@scalex/service-wallet';
import { useLogger } from '@/hooks/useLogger';
import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { AnimatePresence } from 'framer-motion';
import { DollarSign, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getBlockExplorerTxUrl } from '@/configs/chain';

export default function RepayModal({
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
      logger.log(LogLevel.INFO, 'Repay modal opened', LogLabel.USER, ServiceName.WEBAPP, {
        availableTokens: availableTokens.length,
        walletAddress: address
      }, 'repayModal.tsx', 'useEffect');
      setSelectedTokenIndex(1);
    }
  }, [isOpen, availableTokens.length, logger, address]);

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
    repay,
    isPending: isRepaying,
    isApproving,
    isConfirming,
    error: repayError,
    hash,
    currentStep,
  } = useRepay({
    onSuccess: (hash) => {
      logger.log(LogLevel.INFO, 'Repay transaction successful', LogLabel.USER, ServiceName.WEBAPP, {
        txHash: hash,
        source: 'repay_modal'
      }, 'repayModal.tsx', 'handleSuccess');

      // Store transaction hash for display
      setTransactionHash(hash);

      // Reset form on success
      setAmount('');

      // Refetch balance data to show updated balance
      if (onBalanceUpdate) {
        logger.log(LogLevel.INFO, 'Refetching balance data after successful repay', LogLabel.USER, ServiceName.WEBAPP, {
          txHash: hash
        }, 'repayModal.tsx', 'handleSuccess');
        onBalanceUpdate();
      }

      // Clear transaction hash after 10 seconds
      setTimeout(() => setTransactionHash(null), 10000);

      // Optional: close modal after success
      setTimeout(() => onClose(), 3000);
    },
    onError: (error) => {
      logger.logError('Repay transaction failed', {
        error: error.message || error,
        source: 'repay_modal'
      }, 'handleError', 'repayModal.tsx');
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
  console.log('Balance Fetch Parameters:', {
    userAddress: address,
    tokenAddress: selectedToken.address,
    tokenSymbol: selectedToken.symbol,
    tokenDecimals: selectedToken.decimals,
  });

  // Log balance result
  console.log('Balance Query Result:', {
    balance: balance?.toString(),
    formattedBalance: balance ? formatTokenAmount(balance, selectedToken.decimals) : 'N/A',
  });

  const handleRepay = async () => {
    if (!wallet.isReady || !address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      await repay({
        tokenAddress: selectedToken.address,
        amount,
        decimals: selectedToken.decimals,
      });
    } catch (err: any) {
      console.error('Repay failed:', err);
    } finally {
      // Reset loading state if needed
    }
  };

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
                disabled={isRepaying}
              >
                Max
              </button>
            )}
          </div>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e: any) => setAmount(e.target.value)}
            disabled={isRepaying}
            step="any"
            min="0"
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

        {/* Repay Info */}
        <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#E0E0E0]/10">
          <p className="text-[#A0A0A0] text-xs">
            Repaying will reduce your borrowed balance and improve your collateral ratio. You can repay partially or in full.
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

          {currentStep === RepayStep.REPAYING && (
            <StatusMessage type="loading-process" title="Processing Repayment" message="Please confirm in your wallet" />
          )}

          {currentStep === RepayStep.CONFIRMING && (
            <StatusMessage type="loading-process" title="Confirming Transaction" message="Waiting for confirmation..." />
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
          <Button onClick={handleRepay} disabled={isDisabled} variant="primary">
            {isRepaying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentStep === RepayStep.APPROVING && 'Approving...'}
                {currentStep === RepayStep.REPAYING && 'Processing...'}
              </span>
            ) : (
              `Repay`
            )}
          </Button>
        )}
      </div>
    </ModalWrapper>
  );
}

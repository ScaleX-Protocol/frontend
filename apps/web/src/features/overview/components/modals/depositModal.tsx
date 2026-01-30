import { Button, StatusMessage } from '@/components/modals/modalComponents';
import type { BaseModalProps, Token } from '@/types/modal.types';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';
import { AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, Loader2, ChevronUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { erc20Abi } from 'viem';
import { useReadContract } from 'wagmi';
import { formatTokenAmount } from '@/utils/depositUtils';
import { DepositStep, useDeposit } from '../../hooks/useDeposit';
import { getBlockExplorerTxUrl } from '@/configs/chain';
import { useWalletState } from '@scalex/service-wallet';
import ModalWrapper from '@/components/modals/modalWrapper';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';

export function DepositModal({
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const availableTokens = useMemo(() => {
    return transformCurrenciesToTokens(currencies);
  }, [currencies]);

  // Store selected index instead of token object for better reactivity
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(1);

  // Derive selected token from index - auto-updates when tokens change
  const selectedToken = useMemo(() => {
    return (
      availableTokens[selectedTokenIndex] ||
      availableTokens[0] || {
        address: '0x036CbD53842c5426634d7926b90d857C835a21FB',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      }
    );
  }, [availableTokens, selectedTokenIndex]);

  // Format display name for the dropdown
  const getDisplayName = (token: Token) => {
    return `${token.name || token.symbol} (${token.symbol})`;
  };

  // Reset to first token when modal opens
  useEffect(() => {
    if (isOpen && availableTokens.length > 1) {
      logger.log(
        LogLevel.INFO,
        'Deposit modal opened',
        LogLabel.USER,
        ServiceName.WEBAPP,
        {
          availableTokens: availableTokens.length,
          walletAddress: address,
        },
        'depositModal.tsx',
        'useEffect',
      );
      setSelectedTokenIndex(1);
    }
  }, [isOpen, availableTokens.length, address]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setIsDropdownOpen(false);
    } else {
      setTimeout(() => {
        setAmount('');
        setIsDropdownOpen(false);
      }, 300);
    }
  }, [isOpen]);

  const {
    deposit,
    isPending: isDepositing,
    error: depositError,
    currentStep,
  } = useDeposit({
    onSuccess: (hash) => {
      logger.log(
        LogLevel.INFO,
        'Deposit transaction successful',
        LogLabel.DEPOSIT,
        ServiceName.WEBAPP,
        {
          txHash: hash,
          source: 'deposit_modal',
        },
        'depositModal.tsx',
        'handleSuccess',
      );

      // Store transaction hash for display
      setTransactionHash(hash);

      // Reset form on success
      setAmount('');

      // Refetch balance data to show updated balance
      if (onBalanceUpdate) {
        logger.log(
          LogLevel.INFO,
          'Refetching balance data after successful deposit',
          LogLabel.DEPOSIT,
          ServiceName.WEBAPP,
          {
            txHash: hash,
          },
          'depositModal.tsx',
          'handleSuccess',
        );
        onBalanceUpdate();
      }

      // Clear transaction hash after 10 seconds
      setTimeout(() => setTransactionHash(null), 10000);

      // Optional: close panel after success
      setTimeout(() => onClose(), 3000);
    },
    onError: (error) => {
      logger.logError(
        'Deposit transaction failed',
        {
          error: error.message || error,
          source: 'deposit_modal',
        },
        'handleError',
        'depositModal.tsx',
      );
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
    },
  });

  // Log balance fetch parameters for debugging
  logger.log(LogLevel.DEBUG, 'Balance fetch parameters', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
    userAddress: address,
    tokenAddress: selectedToken.address,
    tokenSymbol: selectedToken.symbol,
    tokenDecimals: selectedToken.decimals,
  }, 'depositModal.tsx', 'balanceFetch');

  // Log balance query result for debugging
  logger.log(LogLevel.DEBUG, 'Balance query result', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
    balance: balance?.toString(),
    formattedBalance: balance ? formatTokenAmount(balance, selectedToken.decimals) : 'N/A',
  }, 'depositModal.tsx', 'balanceQuery');

  // Formatted available balance
  const availableBalance = useMemo(() => {
    if (balance !== undefined && balance !== null) {
      return formatTokenAmount(balance, selectedToken.decimals);
    }
    return '0';
  }, [balance, selectedToken.decimals]);

  const handleDeposit = async () => {
    if (!wallet.isReady || !address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      await deposit({
        tokenAddress: selectedToken.address,
        amount,
        decimals: selectedToken.decimals,
        recipient: wallet.embeddedWallet.address,
      });
    } catch (error: any) {
      logger.logError('Deposit failed', { error: error?.message || error }, 'handleDeposit', 'depositModal.tsx');
    } finally {
      // Reset loading state if needed
    }
  };

  // Handle percentage button clicks
  const handlePercentageClick = (percentage: number) => {
    const balanceNum = parseFloat(availableBalance);
    if (balanceNum > 0) {
      const newAmount = (balanceNum * percentage / 100).toFixed(selectedToken.decimals > 6 ? 6 : selectedToken.decimals);
      setAmount(newAmount);
    }
  };

  const isDisabled =
    !wallet.isReady || !address || !amount || parseFloat(amount) <= 0 || isDepositing || currenciesLoading;

  // Check if amount has value for styling
  const hasValue = amount && parseFloat(amount) > 0;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Deposit Asset"
      icon={ArrowDownToLine}
      isProcessing={isDepositing}
    >
      {/* Content */}
      <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto">
        {/* Token Selection */}
        <div>
          <label htmlFor="token-select" className="text-[#A0A0A0] text-sm block mb-2">
            Select Asset
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => !isDepositing && !currenciesLoading && setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-[#111111] border border-[#E0E0E0]/20 rounded-[10px] text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              disabled={isDepositing || currenciesLoading}
            >
              <span>
                {currenciesLoading ? 'Loading...' : getDisplayName(selectedToken)}
              </span>
              <ChevronUp
                className={`w-5 h-5 text-[#E0E0E0]/40 transition-transform ${isDropdownOpen ? '' : 'rotate-180'}`}
              />
            </button>
            {isDropdownOpen && availableTokens.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-[#E0E0E0]/20 rounded-[10px] overflow-hidden z-10 max-h-48 overflow-y-auto">
                {availableTokens.map((token, index) => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => {
                      setSelectedTokenIndex(index);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-[#E0E0E0] hover:bg-[#252525] transition-colors ${
                      index === selectedTokenIndex ? 'bg-[#252525]' : ''
                    }`}
                  >
                    {getDisplayName(token)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[#A0A0A0] text-sm leading-[16px]">Amount</label>
            <span className="text-[#666666] text-sm leading-[16px]">
              Available: {availableBalance} {selectedToken.symbol}
            </span>
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
            disabled={isDepositing}
            className={`w-full px-4 py-3 bg-[#111111] border border-[#E0E0E0]/20 rounded-[10px] text-[#E0E0E0] placeholder-[#666666] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              hasValue ? 'border-[#F06718]' : 'border-[#E0E0E0]/20 focus:border-[#F06718]'
            }`}
          />

          {/* Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[25, 50, 75].map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() => handlePercentageClick(percent)}
                disabled={isDepositing || parseFloat(availableBalance) === 0}
                className="px-3 py-1.5 bg-transparent border border-[#FFFFFF]/16 rounded-[8px] text-[#E0E0E0] text-sm font-medium hover:bg-[#252525] hover:border-[#E0E0E0]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {percent}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePercentageClick(100)}
              disabled={isDepositing || parseFloat(availableBalance) === 0}
              className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                hasValue && amount === availableBalance
                  ? 'bg-[#1A1A1A] border-[#E0E0E0]/50 text-[#E0E0E0]'
                  : 'bg-transparent border-[#E0E0E0]/30 text-[#E0E0E0] hover:bg-[#252525] hover:border-[#E0E0E0]/50'
              }`}
            >
              Max
            </button>
          </div>
        </div>

        {/* Deposit Info */}
        <div className="p-3 rounded-[10px] bg-[#1A1A1A] border border-[#E0E0E0]/10">
          <p className="text-[#A0A0A0] text-xs leading-[16px] font-light">
            Depositing assets will transfer them from your wallet to the lending protocol. You can withdraw anytime.
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {currentStep === DepositStep.APPROVING && (
            <StatusMessage type="loading-approve" title="Approving Token" message="Please confirm in your wallet" />
          )}

          {currentStep === DepositStep.CONFIRMING && (
            <StatusMessage type="loading-process" title="Processing Deposit" message="Waiting for confirmation..." />
          )}

          {currentStep === DepositStep.SYNCING && (
            <StatusMessage type="loading-process" title="Syncing Indexer" message="Waiting for balance to update..." />
          )}

          {currentStep === DepositStep.COMPLETED && (
            <StatusMessage type="success" title="Deposit Confirmed!" message="Your assets have been deposited" />
          )}

          {currentStep === DepositStep.ERROR && depositError && (
            <StatusMessage type="error" title="Deposit Failed" message={depositError.message} />
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
      <div className="px-6 py-5 border-t border-[#1F1F1F]">
        {!wallet.isConnected ? (
          <Button onClick={() => wallet.login()} variant="primary">
            Connect Wallet
          </Button>
        ) : (
          <Button onClick={handleDeposit} disabled={isDisabled} variant="primary">
            {isDepositing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentStep === DepositStep.APPROVING && 'Approving...'}
                {currentStep === DepositStep.DEPOSITING && 'Processing...'}
                {currentStep === DepositStep.SYNCING && 'Syncing...'}
              </span>
            ) : (
              'Deposit'
            )}
          </Button>
        )}
      </div>
    </ModalWrapper>
  );
}

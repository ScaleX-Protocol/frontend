import { useEffect, useMemo, useState } from 'react';
import { ArrowUpFromLine, Loader2, ChevronUp } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useChainWithdraw } from '../../hooks/useChainWithdraw';
import { WithdrawStep } from '../../hooks/useWithdraw';
import { useWalletState } from '@scalex/service-wallet';
import { useLogger } from '@/hooks/useLogger';
import { type UseCurrenciesParams, useCurrencies } from '@/hooks/useCurrencies';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import ModalWrapper from '@/components/modals/modalWrapper';
import { Button, StatusMessage } from '@/components/modals/modalComponents';
import type { BaseModalProps, Token } from '@/types/modal.types';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';
import { getBlockExplorerTxUrl, ChainConfig } from '@/configs/chain';

export function WithdrawModal({
  isOpen,
  onClose,
  currencies = [],
  currenciesLoading = false,
  onBalanceUpdate,
}: BaseModalProps) {
  const wallet = useWalletState();
  const logger = useLogger();

  const address = wallet.embeddedWallet.address;
  // Always use configured chainId from environment, not wallet's chainId
  const chainId = ChainConfig.defaultChainId;

  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch currencies for withdraw (including synthetic tokens)
  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    limit: 50,
    onlyActual: false, // Get all tokens including synthetic
  };

  const { data: currenciesData, isLoading: currenciesDataLoading } = useCurrencies(currenciesParams);

  const allAvailableTokens = useMemo(() => {
    const tokens = currenciesData?.data?.items || [];
    return transformCurrenciesToTokens(tokens);
  }, [currenciesData?.data?.items]);

  // Filter to show only synthetic tokens for withdrawal
  const availableTokens = useMemo(() => {
    return allAvailableTokens.filter(token =>
      token.symbol.startsWith('gs') ||
      token.name.toLowerCase().includes('synthetic')
    );
  }, [allAvailableTokens]);

  const isLoading = currenciesLoading || currenciesDataLoading;

  // Store selected index instead of token object for better reactivity
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0);

  // Derive selected token from index - auto-updates when tokens change
  const selectedToken = useMemo(() => {
    return availableTokens[selectedTokenIndex] ||
      availableTokens[0] ||
    {
      address: '0x14786de4d37e7ce566868dcd84b38b9b4e751121',
      symbol: 'gsETH',
      name: 'Ethereum',
      decimals: 18,
      balance: '0',
    };
  }, [availableTokens, selectedTokenIndex]);

  // Get available balance for selected token
  const availableBalance = useMemo(() => {
    const token = selectedToken as Token & { balance?: string };
    return token.balance || '0';
  }, [selectedToken]);

  // Format display name for the dropdown
  const getDisplayName = (token: Token) => {
    // Remove 'gs' prefix if present and format nicely
    const symbol = token.symbol.replace(/^gs/, '');
    return `${token.name || symbol} (${token.symbol})`;
  };

  // Reset to first synthetic token when modal opens
  useEffect(() => {
    if (isOpen && availableTokens.length > 0) {
      logger.log(LogLevel.INFO, 'Withdraw modal opened', LogLabel.USER, ServiceName.WEBAPP, {
        availableTokens: availableTokens.length,
        walletAddress: address,
        chainId,
        firstToken: availableTokens[0],
        allAvailableTokensCount: allAvailableTokens.length,
      }, 'withdrawModal.tsx', 'useEffect');
      setSelectedTokenIndex(0); // Start with first synthetic token
    }
  }, [isOpen]);

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
    withdraw,
    isPending: isWithdrawing,
    error: withdrawError,
    txHash: hash,
    currentStep,
    chainType,
  } = useChainWithdraw({
    onSuccess: (hash) => {
      logger.log(LogLevel.INFO, 'Withdraw transaction successful', LogLabel.WITHDRAW, ServiceName.WEBAPP, {
        txHash: hash,
        source: 'withdraw_modal'
      }, 'withdrawModal.tsx', 'handleSuccess');

      // Store transaction hash for display
      setTransactionHash(hash);

      // Reset form on success
      setAmount('');

      // Refetch balance data to show updated balance
      if (onBalanceUpdate) {
        logger.log(LogLevel.INFO, 'Refetching balance data after successful withdrawal', LogLabel.WITHDRAW, ServiceName.WEBAPP, {
          txHash: hash
        }, 'withdrawModal.tsx', 'handleSuccess');
        onBalanceUpdate();
      }

      // Clear transaction hash after 10 seconds
      setTimeout(() => setTransactionHash(null), 10000);

      // Optional: close panel after success
      setTimeout(() => onClose(), 3000);
    },
    onError: (error) => {
      logger.logError('Withdraw transaction failed', {
        error: error.message || error,
        source: 'withdraw_modal'
      }, 'handleError', 'withdrawModal.tsx');
    },
  });

  const handleWithdraw = async () => {
    if (!wallet.isReady || !address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      logger.log(LogLevel.DEBUG, 'Preparing withdrawal', LogLabel.WITHDRAW, ServiceName.WEBAPP, {
        selectedToken: {
          address: selectedToken.address,
          symbol: selectedToken.symbol,
          decimals: selectedToken.decimals,
          // Check if underlyingTokenAddress exists
          underlyingTokenAddress: (selectedToken as any).underlyingTokenAddress,
        },
        amount,
        allAvailableTokensCount: allAvailableTokens.length,
      }, 'withdrawModal.tsx', 'handleWithdraw');

      // For synthetic tokens, pass the underlying token address to the hook
      // The hook will handle converting to Currency for the smart contract
      if (chainType === 'solana') {
        // Solana withdraw: pass wallet + market info
        await withdraw({
          marketAddress: '', // TODO: resolve from selected market context
          wallet: {
            address: wallet.embeddedWallet.address,
            signTransaction: async (tx: any) => tx, // Privy handles signing
          },
        } as any);
      } else {
        // EVM withdraw
        await withdraw({
          tokenAddress: selectedToken.address,
          amount,
          decimals: selectedToken.decimals,
          isSynthetic: true,
          availableTokens: allAvailableTokens,
        } as any);
      }
    } catch (err: any) {
      // Error is already handled by the hook
    }
  };

  // Handle percentage button clicks
  const handlePercentageClick = (percentage: number) => {
    const balance = parseFloat(availableBalance);
    if (balance > 0) {
      const newAmount = (balance * percentage / 100).toFixed(selectedToken.decimals > 6 ? 6 : selectedToken.decimals);
      setAmount(newAmount);
    }
  };

  const isDisabled =
    !wallet.isReady || !address || !amount || parseFloat(amount) <= 0 || isWithdrawing || isLoading;

  // Check if amount has value for styling
  const hasValue = amount && parseFloat(amount) > 0;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw Asset"
      icon={ArrowUpFromLine}
      isProcessing={isWithdrawing}
    >
      {/* Content */}
      <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto">
        {/* Token Selection */}
        <div>
          <label htmlFor="token-select" className="text-[#A0A0A0] text-sm leading-[16px] block mb-2">
            Select Synthetic Asset to Withdraw
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => !isWithdrawing && !isLoading && setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-[#111111] border border-[#E0E0E0]/20 rounded-[10px] text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              disabled={isWithdrawing || isLoading}
            >
              <span>
                {isLoading ? 'Loading...' : getDisplayName(selectedToken)}
              </span>
              <ChevronUp
                className={`w-5 h-5 text-[#E0E0E0]/40 transition-transform ${isDropdownOpen ? '' : 'rotate-180'}`}
              />
            </button>
            {isDropdownOpen && availableTokens.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-[#E0E0E0]/20 rounded-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
                {availableTokens.map((token, index) => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => {
                      setSelectedTokenIndex(index);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-[#E0E0E0] hover:bg-[#252525] transition-colors ${index === selectedTokenIndex ? 'bg-[#252525]' : ''
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
          <div className="flex justify-between items-center mb-2">
            <label className="text-[#A0A0A0] text-sm leading-[16px]">Amount</label>
            <span className="text-[#666666] text-sm leading-[16px]">
              Available to withdraw: {availableBalance} {selectedToken.symbol.replace(/^gs/, '')}
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
            disabled={isWithdrawing}
            className={`w-full px-4 py-3 bg-[#111111] border border-[#E0E0E0]/20 rounded-[10px] text-[#E0E0E0] placeholder-[#666666] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hasValue ? 'border-[#F06718]' : 'border-[#E0E0E0]/20 focus:border-[#F06718]'
              }`}
          />

          {/* Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[25, 50, 75].map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() => handlePercentageClick(percent)}
                disabled={isWithdrawing || parseFloat(availableBalance) === 0}
                className="px-3 py-1.5 bg-transparent border border-[#FFFFFF]/16 rounded-[8px] text-[#FFFFFF] text-sm font-medium leading-[20px] hover:bg-[#252525] hover:border-[#E0E0E0]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {percent}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePercentageClick(100)}
              disabled={isWithdrawing || parseFloat(availableBalance) === 0}
              className={`px-3 py-1.5 border border-[#FFFFFF]/16 rounded-[8px] text-[#FFFFFF] text-sm font-medium leading-[20px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hasValue && amount === availableBalance
                  ? 'bg-[#1A1A1A] border-[#E0E0E0]/50 text-[#E0E0E0]'
                  : 'bg-transparent border-[#E0E0E0]/30 text-[#E0E0E0] hover:bg-[#252525] hover:border-[#E0E0E0]/50'
                }`}
            >
              Max
            </button>
          </div>
        </div>

        {/* Withdraw Info */}
        <div className="p-3 rounded-[10px] bg-[#1A1A1A] border border-[#E0E0E0]/10">
          <p className="text-[#A0A0A0] text-xs leading-[16px] font-bold mb-2">
            Synthetic Token Withdrawal:
          </p>
          <ul className="text-[#A0A0A0] text-xs leading-[16px] space-y-1 list-disc list-inside">
            <li>Your tokens convert back to original asset</li>
            <li>All earned interest included automatically</li>
            <li>Sent directly to your connected wallet</li>
            <li>Usually completes in 1-2 minutes</li>
          </ul>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {currentStep === WithdrawStep.CONFIRMING && (
            <StatusMessage type="loading-process" title="Processing Withdrawal" message="Waiting for confirmation..." />
          )}

          {currentStep === WithdrawStep.SYNCING && (
            <StatusMessage type="loading-process" title="Syncing Indexer" message="Waiting for balance to update..." />
          )}

          {currentStep === WithdrawStep.COMPLETED && (
            <StatusMessage type="success" title="Withdrawal Confirmed!" message="Your assets have been withdrawn" />
          )}

          {currentStep === WithdrawStep.ERROR && withdrawError && (
            <StatusMessage type="error" title="Withdrawal Failed" message={withdrawError.message} />
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
          <Button onClick={handleWithdraw} disabled={isDisabled} variant="primary">
            {isWithdrawing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentStep === WithdrawStep.WITHDRAWING && 'Processing...'}
                {currentStep === WithdrawStep.SYNCING && 'Syncing...'}
              </span>
            ) : (
              'Withdraw'
            )}
          </Button>
        )}
      </div>
    </ModalWrapper>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpFromLine, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useWithdraw, WithdrawStep } from '../../hooks/useWithdraw';
import { useWalletState } from '@/hooks/useWalletState';
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
  const chainId = wallet.embeddedWallet.chainId || ChainConfig.defaultChainId;

  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

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
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(1);

  // Derive selected token from index - auto-updates when tokens change
  const selectedToken = useMemo(() => {
    return availableTokens[selectedTokenIndex] ||
           availableTokens[0] ||
           {
             address: '0x14786de4d37e7ce566868dcd84b38b9b4e751121',
             symbol: 'gsUSDC',
             name: 'ScaleX Synthetic USDC',
             decimals: 6,
           };
  }, [availableTokens, selectedTokenIndex]);

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
  }, [isOpen, availableTokens.length, logger, address, chainId, availableTokens, allAvailableTokens.length]);

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
    withdraw,
    isPending: isWithdrawing,
    isConfirming,
    isConfirmed,
    error: withdrawError,
    hash,
    currentStep,
  } = useWithdraw({
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
      await withdraw({
        tokenAddress: selectedToken.address,
        amount,
        decimals: selectedToken.decimals,
        isSynthetic: true, // Flag to indicate this is synthetic token withdrawal
        availableTokens: allAvailableTokens, // Pass API data for token lookups
      });
    } catch (err: any) {
      // Error is already handled by the hook
    }
  };

  const isDisabled =
    !wallet.isReady || !address || !amount || parseFloat(amount) <= 0 || isWithdrawing || isLoading;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw Assets"
      icon={ArrowUpFromLine}
      isProcessing={isWithdrawing}
    >
      {/* Content */}
      <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-240px)] overflow-y-auto">
        {/* Token Selection */}
        <div>
          <label htmlFor="token-select" className="text-[#A0A0A0] text-sm block mb-2">
            Select Synthetic Asset to Withdraw
          </label>
          <select
            id="token-select"
            value={selectedToken.symbol}
            onChange={(e) => {
              const index = availableTokens.findIndex((t) => t.symbol === e.target.value);
              if (index !== -1) setSelectedTokenIndex(index);
            }}
            className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
            disabled={isWithdrawing || isLoading}
          >
            {isLoading ? (
              <option disabled>Loading synthetic tokens...</option>
            ) : availableTokens.length === 0 ? (
              <option disabled>No synthetic tokens available</option>
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
          <label className="text-[#A0A0A0] text-sm block mb-2">Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e: any) => setAmount(e.target.value)}
            disabled={isWithdrawing}
            step="any"
            min="0"
            className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-sm text-[#A0A0A0] mt-2">
            Check your available balance in the dashboard
          </p>
        </div>

        {/* Withdraw Info */}
        <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#E0E0E0]/10">
          <p className="text-[#A0A0A0] text-xs mb-2">
            <strong>Synthetic Token Withdrawal:</strong> Burning synthetic tokens will transfer the equivalent underlying assets (USDC, WETH, etc.) back to your embedded wallet.
          </p>
          <p className="text-[#A0A0A0] text-xs">
            Any accumulated yield will be automatically claimed during withdrawal.
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {currentStep === WithdrawStep.CONFIRMING && (
            <StatusMessage type="loading-process" title="Processing Withdrawal" message="Waiting for confirmation..." />
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
      <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#252525]">
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

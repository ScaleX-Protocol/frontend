import { ChainConfig } from '@/configs/chain';
import { useCurrencies, type UseCurrenciesParams } from '@/hooks/useCurrencies';
import { useWalletState } from '@scalex/service-wallet';
import { transformCurrenciesToTokens } from '@/utils/currency.helper';
import { useMemo, useState } from 'react';
import { erc20Abi } from 'viem';
import { useReadContract } from 'wagmi';
import { formatTokenAmount } from '@/utils/depositUtils';
import { DepositStep, useDeposit } from '../../hooks/useDeposit';
import { LogLabel, LogLevel, ServiceName } from '@/utils/logger';
import useLogger from '@/hooks/useLogger';
import { AnimatePresence } from 'framer-motion';
import { Button, StatusMessage } from '@/components/modals/modalComponents';
import { Loader2 } from 'lucide-react';

export default function SheetContentDeposit() {
  // Wallet State And Chain Id
  const wallet = useWalletState();
  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;

  // Currencies Data
  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    onlyActual: true,
    limit: 50,
  };

  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies(currenciesParams);

  const availableCurrencies = useMemo(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  // Token Data
  const availableTokens = useMemo(() => {
    return transformCurrenciesToTokens(availableCurrencies);
  }, [availableCurrencies]);

  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(1);

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

  // Balance Data
  const { data: balance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [wallet.externalWallet.address as `0x${string}`],
    query: {
      enabled: !!wallet.externalWallet.address && !!selectedToken.address,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Amount State
  const [amount, setAmount] = useState('');

  // Logger
  const logger = useLogger();

  // Deposit Hooks
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

      // Reset form on success
      setAmount('');

      /*
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
    */

      // Optional: close panel after success
      //   setTimeout(() => onClose(), 3000);
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

  // Handle deposit
  const handleDeposit = async () => {
    if (!wallet.isReady || !wallet.externalWallet.address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      await deposit({
        tokenAddress: selectedToken.address,
        amount,
        decimals: selectedToken.decimals,
        recipient: wallet.embeddedWallet.address,
      });
    } catch (err: any) {
      logger.logError(
        'Error during deposit process',
        {
          error: err.message || err,
        },
        'handleDeposit',
        'depositModal.tsx',
      );
    }
  };

  // Disable state
  const isDisabled =
    !wallet.isReady ||
    !wallet.externalWallet.address ||
    !amount ||
    parseFloat(amount) <= 0 ||
    isDepositing ||
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
            const index = availableTokens.findIndex((t) => t.symbol === e.target.value);
            if (index !== -1) setSelectedTokenIndex(index);
          }}
          className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#F06718] transition-colors disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
          disabled={isDepositing || currenciesLoading}
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
          <label htmlFor="" className="text-[#A0A0A0] text-sm">
            Amount
          </label>
          {balance && (
            <button
              type="button"
              onClick={() => setAmount(formatTokenAmount(balance, selectedToken.decimals))}
              className="text-xs text-[#F06718] hover:text-[#FF7A2F] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDepositing}
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
          disabled={isDepositing}
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

      {/* Deposit Info */}
      <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#E0E0E0]/10">
        <p className="text-[#A0A0A0] text-xs">
          Depositing assets will transfer them from your wallet to the lending protocol.
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

        {currentStep === DepositStep.COMPLETED && (
          <StatusMessage type="success" title="Deposit Confirmed!" message="Your assets have been deposited" />
        )}

        {currentStep === DepositStep.ERROR && depositError && (
          <StatusMessage type="error" title="Deposit Failed" message={depositError.message} />
        )}
      </AnimatePresence>

      {/* Deposit Button */}
      <div className="py-4 border-t border-[#3A3A3A]">
        <Button onClick={handleDeposit} disabled={isDisabled} variant="primary">
          {isDepositing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {currentStep === DepositStep.APPROVING && 'Approving...'}
              {currentStep === DepositStep.DEPOSITING && 'Processing...'}
            </span>
          ) : (
            `Deposit`
          )}
        </Button>
      </div>
    </div>
  );
}

import { Button, StatusMessage } from '@/components/modals/modalComponents';
import ModalWrapper from '@/components/modals/modalWrapper';
import type { BaseModalProps } from '@/types/modal.types';
import type { AvailableToBorrow, LendingSummary } from '../../types/lending.types';
import { formatTokenAmount } from '@/utils/borrowUtils';
import { useBorrow, BorrowStep } from '../../hooks/useBorrow';
import { useWalletState } from '@scalex/service-wallet';
import { useLogger } from '@/hooks/useLogger';
import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { ChainTypeConfig } from '@/configs/chainType';
import { logger } from '@/utils/prodLogger';
import { AnimatePresence } from 'framer-motion';
import { useTokenPrices } from '../../hooks/useTokenPrices';

import { ArrowUpFromLine, Loader2, Infinity as InfinityIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getBlockExplorerTxUrl } from '@/configs/chain';

// Create contextual logger for BorrowModal component
const log = logger.withContext({ component: 'BorrowModal' });

// Extended props for BorrowModal
interface BorrowModalProps extends BaseModalProps {
  selectedAsset: AvailableToBorrow | null;
  summary?: LendingSummary | null;
}

export default function BorrowModal({
  isOpen,
  onClose,
  selectedAsset,
  summary = null,
  currencies = [],
  currenciesLoading = false,
  onBalanceUpdate,
}: BorrowModalProps) {
  const wallet = useWalletState();
  const loggerHook = useLogger();

  // Use external wallet if connected (e.g. Phantom), else embedded wallet
  const address = wallet.externalWallet.address !== 'Not Connected'
    ? wallet.externalWallet.address
    : wallet.embeddedWallet.address;

  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Use the selected asset from props
  const tokenAddress = selectedAsset?.assetAddress || '';
  const tokenSymbol = selectedAsset?.asset || 'USDC';
  const tokenDecimals = 18; // Default, should come from currency data

  // Find token decimals from currencies
  const currencyInfo = currencies?.find(
    c => c.address.toLowerCase() === tokenAddress.toLowerCase() || c.symbol === tokenSymbol
  );
  const decimals = currencyInfo?.decimals || tokenDecimals;

  // Debug logging for decimal issues
  console.log('[BorrowModal] Token Info:', {
    symbol: tokenSymbol,
    address: tokenAddress,
    decimals,
    currencyInfoFound: !!currencyInfo,
    currencyInfoDecimals: currencyInfo?.decimals,
    availableCurrencies: currencies?.length,
  });

  // Reset amount when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setTransactionHash(null);
    }
  }, [isOpen]);

  const { getUsdValue } = useTokenPrices();

  const {
    borrow,
    isPending: isBorrowing,
    error: borrowError,
    currentStep,
  } = useBorrow({
    onSuccess: (hash) => {
      loggerHook.log(LogLevel.INFO, 'Borrow transaction successful', LogLabel.USER, ServiceName.WEBAPP, {
        txHash: hash,
        source: 'borrow_modal'
      }, 'borrowModal.tsx', 'handleSuccess');

      setTransactionHash(hash);
      setAmount('');

      if (onBalanceUpdate) {
        onBalanceUpdate();
      }

      setTimeout(() => setTransactionHash(null), 10000);
      setTimeout(() => onClose(), 3000);
    },
    onError: (error) => {
      loggerHook.logError('Borrow transaction failed', {
        error: error.message || error,
        source: 'borrow_modal'
      }, 'handleError', 'borrowModal.tsx');
    },
  });

  // Get user balance for selected token
  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: ChainTypeConfig.isEVM && !!address && !!tokenAddress,
      retry: 3,
      retryDelay: 1000,
    }
  });

  const handleBorrow = async () => {
    if (!wallet.isReady || !address || !amount || parseFloat(amount) <= 0 || !tokenAddress) {
      return;
    }

    // Log borrow attempt details
    console.log('[BorrowModal] Attempting to borrow:', {
      asset: tokenSymbol,
      address: tokenAddress,
      amount,
      decimals,
      borrowingPowerShown: summary?.borrowingPower,
      healthFactorShown: summary?.healthFactor,
      totalBorrowedShown: summary?.totalBorrowed,
      totalSuppliedShown: summary?.totalSupplied,
      collateralFactor: selectedAsset?.collateralFactor,
    });

    try {
      await borrow({
        tokenAddress,
        amount,
        decimals,
      });
    } catch (error) {
      console.error('[BorrowModal] Borrow failed:', error);
      console.error('[BorrowModal] This may indicate asset isolation or per-asset borrowing limits');
    }
  };

  // Get asset-specific data
  const borrowAPY = selectedAsset?.realTimeRates?.borrowAPY || selectedAsset?.apy || '0%';
  const ltvValue = selectedAsset?.collateralFactor || '0';
  const liquidationThreshold = selectedAsset?.liquidationThreshold || '0';
  const ltvLiqLtv = `${ltvValue}% / ${liquidationThreshold}%`;

  // Use real data from summary prop, fallback to defaults
  const borrowingPower = summary?.borrowingPower
    ? `$ ${parseFloat(summary.borrowingPower).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$ 0.00';
  const totalSupplyCollateral = summary?.totalSupplied
    ? `$ ${parseFloat(summary.totalSupplied).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$ 0.00';
  const healthFactor = summary?.healthFactor || '∞';

  const isDisabled = !wallet.isReady || !address || !amount || parseFloat(amount) <= 0 || isBorrowing || currenciesLoading || !selectedAsset;

  // Don't render if no asset selected
  if (!selectedAsset) {
    return null;
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Borrow Assets"
      icon={ArrowUpFromLine}
      isProcessing={isBorrowing}
    >
      {/* Content */}
      <div className="px-6 py-5 space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
        {/* Selected Asset Display (replacing dropdown) */}
        <div>
          <label className="text-[#A0A0A0] text-sm block mb-2 font-dm-sans">
            Asset
          </label>
          <div className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-[10px] text-[#E0E0E0] font-dm-sans flex items-center justify-between">
            <span>{selectedAsset.asset} ({tokenSymbol})</span>
          </div>
        </div>

        {/* Borrow Amount Input */}
        <div>
          <label className="text-[#A0A0A0] text-sm block mb-2 font-dm-sans">Borrow</label>
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
                  }
                }}
                disabled={isBorrowing}
                className="flex-1 bg-transparent text-[#E0E0E0] text-lg font-medium placeholder-[#666666] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-dm-sans"
              />
              <span className="text-[#E0E0E0] font-medium font-dm-sans">{tokenSymbol}</span>
            </div>
            <div className="text-[#666666] text-sm mt-1 font-dm-sans">
              {getUsdValue(amount, tokenSymbol)}
            </div>
          </div>
        </div>

        {/* Borrow Info Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#777777] text-sm font-dm-sans">Borrowing Power</span>
            <span className="text-[#E0E0E0] text-sm font-dm-sans">
              {borrowingPower} <span className="text-[#F06718]">MAX</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#777777] text-sm font-dm-sans">Total Supply Collateral</span>
            <span className="text-[#E0E0E0] text-sm font-dm-sans">{totalSupplyCollateral}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#777777] text-sm font-dm-sans">Borrow APY</span>
            <span className="text-[#E0E0E0] text-sm font-dm-sans">{borrowAPY}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#777777] text-sm font-dm-sans">Health Factor</span>
            <div className="flex items-center gap-2">
              <InfinityIcon className="w-4 h-4 text-[#A3A3A3]" />
              <span className="text-[#A3A3A3]">→</span>
              <span className="text-[#2ECC71] text-sm font-dm-sans">{healthFactor}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#777777] text-sm font-dm-sans">LTV / Liq. LTV</span>
            <span className="text-[#E0E0E0] text-sm font-dm-sans">{ltvLiqLtv}</span>
          </div>
        </div>

        {/* Borrow Info Box */}
        <div className="p-3 rounded-[10px] bg-[#1A1A1A] border border-[#E0E0E0]/10">
          <p className="text-[#A0A0A0] text-xs font-dm-sans leading-relaxed">
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

          {currentStep === BorrowStep.SYNCING && (
            <StatusMessage type="loading-process" title="Syncing Indexer" message="Waiting for balance to update..." />
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
            onClick={handleBorrow}
            disabled={isDisabled}
            className="relative w-full py-3 rounded-full font-medium transition-all text-white bg-[#E86A25] hover:bg-[#F07830] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_3px_6px_rgba(0,0,0,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/20 before:to-transparent before:rounded-t-full"
          >
            <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2 font-dm-sans">
              {isBorrowing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isBorrowing ? (
                currentStep === BorrowStep.VALIDATING ? 'Validating...' :
                  currentStep === BorrowStep.SYNCING ? 'Syncing...' : 'Processing...'
              ) : (
                'Borrow'
              )}
            </span>
          </button>
        )}
      </div>
    </ModalWrapper>
  );
}

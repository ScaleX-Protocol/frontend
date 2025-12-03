import { useEffect, useMemo, useState } from "react";
import type { BaseModalProps, Token } from "../../types/home.types";
import { transformCurrenciesToTokens } from "../../utils/home.helper";
import ModalWrapper from "./modalWrapper";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button, Input, StatusMessage } from "./components";
import { useDeposit } from "../../hooks/useDeposit";
import { useWalletState } from "@/hooks/useWalletState";

export function DepositModal({
  isOpen,
  onClose,
  currencies = [],
  currenciesLoading = false,
  onBalanceUpdate,
}: BaseModalProps) {
  const wallet = useWalletState();

  const address = wallet.embeddedWallet.address;

  const [amount, setAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');

  const availableTokens = useMemo(() => {
    return transformCurrenciesToTokens(currencies);
  }, [currencies]);

  const [selectedToken, setSelectedToken] = useState<Token>(() => {
    return availableTokens[1] || {
      address: '0x036CbD53842c5426634d7926b90d857C835a21FB',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    };
  });

  useEffect(() => {
    if (availableTokens.length > 1 && !selectedToken.address) {
      setSelectedToken(availableTokens[1]);
    }
  }, [availableTokens, selectedToken.address]);

  const { deposit, isPending: isDepositing, isApproving: isApprovingDeposit, isConfirming, isConfirmed, error: depositError, hash, currentStep } = useDeposit({
    onSuccess: (hash) => {
      console.log('Transaction successful:', hash);
      // Reset form on success
      setAmount('');

      // Refetch balance data to show updated balance
      if (onBalanceUpdate) {
        console.log('Refetching balance data after successful deposit');
        onBalanceUpdate();
      }

      // Optional: close panel after success
      setTimeout(() => onClose(), 3000);
    },
    onError: (error) => {
      console.error('Transaction failed:', error);
    },
  });

  const handleDeposit = async () => {
    if (!wallet.isReady || !address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      await deposit({
        tokenAddress: selectedToken.address,
        amount,
        decimals: selectedToken.decimals,
        recipient: address,
      });
    } catch (err: any) {

    } finally {

    }
  };

  const isDisabled =
    !wallet.isReady ||
    !address ||
    !amount ||
    parseFloat(amount) <= 0 ||
    isDepositing ||
    currenciesLoading;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Deposit Assets"
      icon={ArrowDownToLine}
      isProcessing={isDepositing}
    >
      {/* Content */}
      <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-240px)] overflow-y-auto">
        {/* Token Selection */}
        <div>
          <label className="text-[#A0A0A0] text-sm block mb-2">Select Asset</label>
          <select
            value={selectedToken.symbol}
            onChange={(e) => {
              const token = availableTokens.find(t => t.symbol === e.target.value);
              if (token) setSelectedToken(token);
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
        <Input
          label="Amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e: any) => setAmount(e.target.value)}
          disabled={isDepositing}
          step="any"
          min="0"
        />

        {/* Deposit Info */}
        <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#E0E0E0]/10">
          <p className="text-[#A0A0A0] text-xs">
            Depositing assets will transfer them from your wallet to the lending protocol.
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {isApprovingDeposit && (
            <StatusMessage
              type="loading-approve"
              title="Approving Token"
              message="Please confirm in your wallet"
            />
          )}

          {isConfirming && (
            <StatusMessage
              type="loading-process"
              title="Processing Deposit"
              message="Waiting for confirmation..."
            />
          )}

          {isConfirmed && (
            <StatusMessage
              type="success"
              title="Deposit Confirmed!"
              message="Your assets have been deposited"
            />
          )}

          {depositError && (
            <StatusMessage
              type="error"
              title="Deposit Failed"
              message={String(depositError)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#252525]">
        {!wallet.isConnected ? (
          <Button onClick={() => wallet.login()} variant="primary" >Connect Wallet</Button>
        ) : (
          <Button onClick={handleDeposit} disabled={isDisabled} variant="primary">
            {isDepositing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentStep === 'approving' && 'Approving...'}
                {currentStep === 'depositing' && 'Processing...'}
              </span>
            ) : (
              `Deposit`
            )}
          </Button>
        )}
      </div>
    </ModalWrapper>
  );
}
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import Input from '../input';
import Button from '../button';
import { useDeposit } from '@/features/home/hooks/useDeposit';
import { usePrivy } from '@privy-io/react-auth';
import { Currency } from '@/features/faucet/types/faucet.types';

// Transform faucet Currency to Token format and add ETH
const transformCurrenciesToTokens = (currencies: Currency[]) => {
  const tokens = currencies.map(currency => ({
    address: currency.address,
    symbol: currency.symbol,
    name: currency.name,
    decimals: currency.decimals,
  }));

  // Add ETH as the first token
  const ethToken = {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
  };

  return [ethToken, ...tokens];
};

export default function ActionPanel({
  activeTab,
  onClose,
  currencies = [],
  currenciesLoading = false,
  onBalanceUpdate,
}: {
  activeTab: 'deposit' | 'withdraw' | 'transfer';
  onClose: () => void;
  currencies?: Currency[];
  currenciesLoading?: boolean;
  onBalanceUpdate?: () => void;
}) {
  const { user, ready } = usePrivy();

  // Get the Privy embedded wallet address, not the external wallet
  const address = useMemo(() => {
    if (!user?.linkedAccounts) return undefined;

    // Find the Privy embedded wallet (not the external wallet)
    const privyEmbeddedAccount = user.linkedAccounts.find(acc =>
      acc.type === 'wallet' && acc.id && (acc as any).address !== user.wallet?.address
    );

    if (privyEmbeddedAccount && (privyEmbeddedAccount as any).address) {
      return (privyEmbeddedAccount as any).address;
    }

    // Fallback to current wallet if no embedded wallet found
    return user.wallet?.address;
  }, [user]);
  const [amount, setAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');

  // Use currencies passed as props from home component
  const availableTokens = useMemo(() => {
    return transformCurrenciesToTokens(currencies);
  }, [currencies]);

  const [selectedToken, setSelectedToken] = useState(() => {
    // Initialize with first available token or fallback to USDC
    return availableTokens[1] || {
      address: '0x036CbD53842c5426634d7926b90d857C835a21FB',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    };
  });

  // Update selected token when currencies load
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

  const titles = {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    transfer: 'Transfer',
  };

  const handleAction = async () => {
    if (!ready || !address || !amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      if (activeTab === 'deposit') {
        // Handle deposit - approval is now integrated!
        console.log('Calling deposit with recipient:', address);
        await deposit({
          tokenAddress: selectedToken.address,
          amount,
          decimals: selectedToken.decimals,
          recipient: address,
        });
      } else if (activeTab === 'transfer') {
        // Handle transfer (would need separate implementation)
        console.log('Transfer functionality not implemented yet');
      } else if (activeTab === 'withdraw') {
        // Handle withdraw (would need separate implementation)
        console.log('Withdraw functionality not implemented yet');
      }
    } catch (error) {
      // Error is handled by the deposit hook
      console.error('Action failed:', error);
    }
  };

  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="bg-[#2C2C2C] rounded-md p-2 h-[320px] relative flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#E0E0E0] text-lg font-semibold">{titles[activeTab]}</h3>
            <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-[#E0E0E0]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Token Selection - Moved to top */}
            <div>
              <label className="text-[#A0A0A0] text-sm block mb-1">Select Asset</label>
              <select
                value={selectedToken.symbol}
                onChange={(e) => {
                  const token = availableTokens.find(t => t.symbol === e.target.value);
                  if (token) setSelectedToken(token);
                }}
                className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#F06718]"
                disabled={isDepositing || isConfirming || isApprovingDeposit || currenciesLoading}
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

            {/* Amount Input - Full width */}
            <div>
              <Input
                label="Amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isDepositing || isConfirming || isApprovingDeposit}
              />
            </div>

            {activeTab === 'transfer' && (
              <Input
                label="To Address"
                placeholder="0x1a2b3c..."
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
                disabled={isDepositing || isConfirming || isApprovingDeposit}
              />
            )}

            
            {/* Error Display */}
            {depositError && (
              <div className="p-2 rounded bg-red-900/20 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{depositError.message}</span>
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {(isDepositing || isApprovingDeposit) && (
              <div className="p-2 rounded bg-blue-900/20 border border-blue-500/20">
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {currentStep === 'approving' && 'Approving token...'}
                    {currentStep === 'depositing' && 'Processing deposit...'}
                    {(!currentStep || currentStep === 'idle') && 'Processing...'}
                  </span>
                </div>
              </div>
            )}

            {isConfirming && (
              <div className="p-2 rounded bg-yellow-900/20 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Waiting for confirmation...</span>
                </div>
              </div>
            )}

            {isConfirmed && hash && (
              <div className="p-2 rounded bg-green-900/20 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-400">
                  <span className="text-sm">✓ Transaction confirmed!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleAction}
            disabled={
              !ready ||
              !address ||
              !amount ||
              parseFloat(amount) <= 0 ||
              isDepositing ||
              isApprovingDeposit ||
              isConfirming ||
              currenciesLoading
            }
            variant="primary"
            className="w-full"
          >
            {isDepositing ? (
              currentStep === 'approving' ? 'Approving...' :
              currentStep === 'depositing' ? 'Depositing...' :
              'Processing...'
            ) : (
              `${titles[activeTab]}${selectedToken.symbol ? ` ${selectedToken.symbol}` : ''}`
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

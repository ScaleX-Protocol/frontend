'use client';

import { ArrowDown, ChevronRight, Lock } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useCurrencies, type UseCurrenciesParams } from '@/hooks/useCurrencies';
import { useWalletState } from '@/hooks/useWalletState';
import { ChainConfig } from '@/configs/chain';
import type { Currency } from '@/types/currency.types';
import Image from 'next/image';
import { getTokenIcon } from '@/configs/tokens';

interface SwapProps {
  balances: any[];
  isLoadingBalance: boolean;
}

interface TokenSelectorProps {
  selectedToken: Currency | null;
  tokens: Currency[];
  onSelect: (token: Currency) => void;
  isLoading: boolean;
}

function TokenSelector({ selectedToken, tokens, onSelect, isLoading }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!selectedToken) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] rounded-full border border-[#E0E0E0]/20 hover:bg-[#252525] transition-colors"
      >
        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={getTokenIcon(selectedToken.symbol)}
            alt={selectedToken.symbol}
            width={24}
            height={24}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
        <span className="text-[#E0E0E0] font-medium">{selectedToken.symbol}</span>
        <ChevronRight className="w-4 h-4 text-[#E0E0E0]" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-[#1A1A1A] rounded-lg border border-[#E0E0E0]/20 shadow-xl z-50 max-h-64 overflow-y-auto">
            {tokens.map((token) => (
              <button
                key={token.address}
                type="button"
                onClick={() => {
                  onSelect(token);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#252525] transition-colors"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={getTokenIcon(token.symbol)}
                    alt={token.symbol}
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-[#E0E0E0] font-medium">{token.symbol}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Swap({ balances, isLoadingBalance }: SwapProps) {
  const wallet = useWalletState();
  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;

  // Fetch available currencies
  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    limit: 50,
    onlyActual: true,
  };

  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies(currenciesParams);

  const availableTokens = useMemo<Currency[]>(() => {
    return currenciesData?.data?.items || [];
  }, [currenciesData?.data?.items]);

  const [sellToken, setSellToken] = useState<Currency | null>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [buyToken, setBuyToken] = useState<Currency | null>(null);
  const [buyAmount, setBuyAmount] = useState('');

  // Set default tokens when currencies load
  useEffect(() => {
    if (availableTokens.length > 0) {
      if (!sellToken) setSellToken(availableTokens[0]);
      if (!buyToken && availableTokens.length > 1) setBuyToken(availableTokens[1]);
    }
  }, [availableTokens, sellToken, buyToken]);

  // Get balance for a specific token
  const getTokenBalance = (tokenSymbol: string) => {
    if (!balances || balances.length === 0) return '0';

    const tokenBalance = balances.find(
      (balance: any) => balance.asset === tokenSymbol || balance.symbol === tokenSymbol
    );

    if (!tokenBalance) return '0';

    const freeAmount = parseFloat(tokenBalance.free || tokenBalance.available || '0');

    return freeAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const handleSwap = () => {
    const tempToken = sellToken;
    const tempAmount = sellAmount;
    setSellToken(buyToken);
    setSellAmount(buyAmount);
    setBuyToken(tempToken);
    setBuyAmount(tempAmount);
  };

  const handleQuickAction = (percentage: number, type: 'sell' | 'buy') => {
    if (type === 'sell' && sellToken) {
      const balance = parseFloat(getTokenBalance(sellToken.symbol).replace(/,/g, ''));
      const amount = (balance * percentage / 100);
      const sellAmountStr = amount.toString();
      setSellAmount(sellAmountStr);
      // Calculate buy amount using exchange rate
      if (amount > 0) {
        const calculatedBuyAmount = (amount * 0.035).toFixed(6);
        setBuyAmount(calculatedBuyAmount);
      } else {
        setBuyAmount('');
      }
    }
  };

  // Check if user has sufficient balance
  const getSufficientBalanceStatus = () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      return { isDisabled: true, buttonText: 'ENTER AN AMOUNT' };
    }

    if (sellToken) {
      const balance = parseFloat(getTokenBalance(sellToken.symbol).replace(/,/g, ''));
      const amount = parseFloat(sellAmount);

      if (amount > balance) {
        return { isDisabled: true, buttonText: `INSUFFICIENT ${sellToken.symbol}` };
      }
    }

    return { isDisabled: false, buttonText: 'SWAP' };
  };

  const balanceStatus = getSufficientBalanceStatus();

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-4">
        {/* Sell Section */}
        <div className="bg-[#1A1A1A]/50 rounded-2xl p-4 border border-[#E0E0E0]/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A0A0A0] text-sm">Sell</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickAction(0, 'sell')}
                className="px-2 py-1 text-xs text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
              >
                <Lock className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction(0, 'sell')}
                className="px-2 py-1 text-xs text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction(50, 'sell')}
                className="px-2 py-1 text-xs text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction(100, 'sell')}
                className="px-2 py-1 text-xs text-[#A0A0A0] hover:text-[#E0E0E0] transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <TokenSelector
              selectedToken={sellToken}
              tokens={availableTokens}
              onSelect={setSellToken}
              isLoading={currenciesLoading}
            />

            <div className="flex-1 flex flex-col items-end">
              <input
                type="text"
                value={sellAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setSellAmount(value);
                    // Auto-calculate buy amount (1:1 ratio for now)
                    if (value && parseFloat(value) > 0) {
                      // Simple calculation - you can replace with actual exchange rate
                      const calculatedBuyAmount = (parseFloat(value) * 0.035).toFixed(6);
                      setBuyAmount(calculatedBuyAmount);
                    } else {
                      setBuyAmount('');
                    }
                  }
                }}
                placeholder="0"
                className="w-full bg-transparent text-right text-5xl font-bold text-[#E0E0E0] outline-none"
              />
              {sellToken && (
                <span className="text-sm text-[#A0A0A0] mt-1">
                  ${sellAmount || '0'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            type="button"
            onClick={handleSwap}
            className="p-3 rounded-xl bg-[#1A1A1A] border border-[#E0E0E0]/20 hover:bg-[#252525] transition-colors"
          >
            <ArrowDown className="w-5 h-5 text-[#E0E0E0]" />
          </button>
        </div>

        {/* Buy Section */}
        <div className="bg-[#1A1A1A]/50 rounded-2xl p-4 border border-[#E0E0E0]/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A0A0A0] text-sm">Buy</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs text-[#A0A0A0]">
                <Lock className="w-3 h-3" />
              </span>
              <span className="px-2 py-1 text-xs text-[#A0A0A0]">0</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <TokenSelector
              selectedToken={buyToken}
              tokens={availableTokens}
              onSelect={setBuyToken}
              isLoading={currenciesLoading}
            />

            <div className="flex-1 flex flex-col items-end">
              <input
                type="text"
                value={buyAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setBuyAmount(value);
                  }
                }}
                placeholder="0"
                className="w-full bg-transparent text-right text-5xl font-bold text-[#A0A0A0] outline-none"
                readOnly
              />
              {buyToken && buyAmount && parseFloat(buyAmount) > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-green-500 font-medium">0.26%↑</span>
                  <span className="text-sm text-[#A0A0A0]">${buyAmount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fee */}
        <div className="flex items-center text-sm">
          <div className="flex items-center gap-1 text-[#A0A0A0]">
            <span className="w-4 h-4 rounded-full border border-[#E0E0E0]/20 flex items-center justify-center text-xs">©</span>
            <span>1%</span>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <button
        type="button"
        disabled={balanceStatus.isDisabled}
        className="w-full py-3 font-bold text-lg bg-[#4ADE80] hover:bg-[#4ADE80]/80 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4ADE80] uppercase"
      >
        {balanceStatus.buttonText}
      </button>
    </div>
  );
}

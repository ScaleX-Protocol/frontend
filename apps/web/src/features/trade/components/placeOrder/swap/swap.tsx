'use client';

import { ArrowDown, ArrowUp, ChevronRight, ArrowLeft, Search, Copy, Check, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useCurrencies, type UseCurrenciesParams } from '@/hooks/useCurrencies';
import { useWalletState } from '@scalex/service-wallet';
import { ChainConfig } from '@/configs/chain';
import type { Currency } from '@/types/currency.types';
import { getTokenIcon } from '@/configs/tokens';
import { usePrivySwap, getSwapStepLabel } from '@/features/trade/hooks/swap/usePrivySwap';
import { formatSlippage } from '@/utils/swapUtils';
import { Contracts } from '@/configs/contracts';
import { getBlockExplorerTxUrl } from '@/configs/chain';

interface Balance {
  asset?: string;
  symbol?: string;
  free?: string;
  available?: string;
}

interface SwapProps {
  balances: Balance[];
  isLoadingBalance: boolean;
  baseToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  quoteToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
}

interface TokenSelectorProps {
  selectedToken: Currency | null;
  tokens: Currency[];
  onSelect: (token: Currency) => void;
}

function TokenSelector({ selectedToken, tokens, onSelect }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  if (!selectedToken) return null;

  // Filter tokens based on search query
  const filteredTokens = tokens.filter((token) => {
    const query = searchQuery.toLowerCase();
    return (
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query) ||
      token.address.toLowerCase().includes(query)
    );
  });

  const handleCopyAddress = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 bg-[#1A1A1A] rounded-full transition-colors cursor-pointer"
      >
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
          <img src={getTokenIcon(selectedToken.symbol)}
            alt={selectedToken.symbol}


            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-[#E0E0E0] font-medium text-sm">{selectedToken.symbol}</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#E0E0E0]" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Dialog */}
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-[#1A1A1A] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-4 p-4 border-b border-[#E0E0E0]/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[#252525] rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-[#E0E0E0]" />
                </button>

                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A0A0]" />
                  <input
                    type="text"
                    placeholder="Search tokens"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0D0D0D] text-[#E0E0E0] pl-10 pr-4 py-2 rounded-lg outline-none border border-[#E0E0E0]/10 focus:border-[#F06718] transition-colors"
                  />
                </div>
              </div>

              {/* Token List */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredTokens.map((token) => (
                    <button
                      key={token.address}
                      type="button"
                      onClick={() => {
                        onSelect(token);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all border-2 border-transparent hover:border-[#F06718] hover:bg-[#F06718]/5 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                        <img src={getTokenIcon(token.symbol)}
                          alt={token.symbol}


                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 text-left">
                        <div className="text-[#E0E0E0] font-semibold text-lg">
                          {token.symbol}
                        </div>
                        <div className="text-[#A0A0A0] text-sm flex items-center gap-2">
                          <span>{token.name}</span>
                          <span>{formatAddress(token.address)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleCopyAddress(token.address, e)}
                        className="p-2 hover:bg-[#0D0D0D] rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedAddress === token.address ? (
                          <Check className="w-4 h-4 text-[#F06718]" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#A0A0A0]" />
                        )}
                      </button>
                    </button>
                ))}

                {filteredTokens.length === 0 && (
                  <div className="text-center text-[#A0A0A0] py-8">
                    No tokens found
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function Swap({ balances, baseToken, quoteToken }: SwapProps) {
  const wallet = useWalletState();
  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;
  const hasProvider = !!wallet.externalWallet.wallet;

  // Fetch available currencies
  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    limit: 50,
    onlyActual: false,
  };

  const { data: currenciesData } = useCurrencies(currenciesParams);

  const availableTokens = useMemo<Currency[]>(() => {
    return (currenciesData?.data?.items || []).filter((currency) => currency.underlyingTokenAddress !== null);
  }, [currenciesData?.data?.items]);

  const [sellToken, setSellToken] = useState<Currency | null>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [buyToken, setBuyToken] = useState<Currency | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [slippageBps] = useState(100); // 1% default
  const [isCalculatingOutput, setIsCalculatingOutput] = useState(false);
  const [isSellInputFocused, setIsSellInputFocused] = useState(false);
  const [isFlipButtonHovered, setIsFlipButtonHovered] = useState(false);

  // Initialize swap hook
  const {
    executeSwap,
    isPending,
    isConfirming,
    isConfirmed,
    error: swapError,
    hash,
    currentStep,
    estimatedOutput,
    isAuthenticated,
  } = usePrivySwap({
    onSuccess: (txHash) => {
      console.log('Swap successful:', txHash);
      // Reset form after a delay to show success message
      setTimeout(() => {
        setSellAmount('');
        setBuyAmount('');
      }, 3000);
    },
    onError: (error) => {
      console.error('Swap failed:', error);
    },
  });

  // Set default tokens based on current market
  useEffect(() => {
    if (availableTokens.length > 0 && baseToken && quoteToken) {
      // Find tokens matching the current market
      const baseCurrency = availableTokens.find(t => t.symbol === baseToken.symbol);
      const quoteCurrency = availableTokens.find(t => t.symbol === quoteToken.symbol);

      if (!sellToken && quoteCurrency) {
        // Default sell token is quote (e.g., gsUSDC)
        setSellToken(quoteCurrency);
      }
      if (!buyToken && baseCurrency) {
        // Default buy token is base (e.g., gsWETH)
        setBuyToken(baseCurrency);
      }

      // Fallback if market tokens not found in available tokens
      if (!sellToken && !quoteCurrency && availableTokens.length > 0) {
        setSellToken(availableTokens[0]);
      }
      if (!buyToken && !baseCurrency && availableTokens.length > 1) {
        setBuyToken(availableTokens[1]);
      }
    }
  }, [availableTokens, sellToken, buyToken, baseToken, quoteToken]);

  // Format large numbers with K, M, B, T abbreviations
  const formatBalance = (num: number): string => {
    if (num === 0) return '0';

    const absNum = Math.abs(num);

    if (absNum >= 1e12) {
      return (num / 1e12).toFixed(2) + 'T';
    } else if (absNum >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    } else if (absNum >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    } else if (absNum >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    } else {
      return num.toFixed(2);
    }
  };

  // Get raw numeric balance for a specific token (for calculations)
  const getRawTokenBalance = (tokenSymbol: string): number => {
    if (!balances || balances.length === 0) return 0;

    const tokenBalance = balances.find(
      (balance) => balance.asset === tokenSymbol || balance.symbol === tokenSymbol
    );

    if (!tokenBalance) return 0;

    // Find the token to get its decimals
    const token = availableTokens.find(t => t.symbol === tokenSymbol);
    const decimals = token?.decimals || 18;

    // Get raw balance and convert from smallest unit to actual token amount
    const rawBalance = parseFloat(tokenBalance.free || tokenBalance.available || '0');
    const actualAmount = rawBalance / Math.pow(10, decimals);

    return actualAmount;
  };

  // Get formatted balance for display
  const getTokenBalance = (tokenSymbol: string) => {
    const actualAmount = getRawTokenBalance(tokenSymbol);
    return formatBalance(actualAmount);
  };

  const handleFlipTokens = () => {
    const tempToken = sellToken;
    const tempAmount = sellAmount;
    setSellToken(buyToken);
    setSellAmount(buyAmount);
    setBuyToken(tempToken);
    setBuyAmount(tempAmount);
  };

  const handleExecuteSwap = async () => {
    if (!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) <= 0) {
      console.error('Invalid swap parameters');
      return;
    }

    if (!isAuthenticated) {
      console.error('Wallet not connected');
      return;
    }

    try {
      await executeSwap({
        srcToken: sellToken.address,
        dstToken: buyToken.address,
        srcAmount: sellAmount,
        srcDecimals: sellToken.decimals,
        dstDecimals: buyToken.decimals,
        slippageToleranceBps: slippageBps,
        maxHops: 2,
      });
    } catch (error) {
      // Error already handled by onError callback and shown in UI
      console.error('Swap execution error:', error);
    }
  };

  const handleQuickAction = (percentage: number, type: 'sell' | 'buy') => {
    if (type === 'sell' && sellToken) {
      const balance = getRawTokenBalance(sellToken.symbol);
      const amount = (balance * percentage / 100);
      const sellAmountStr = amount.toString();
      setSellAmount(sellAmountStr);
      // Buy amount will be calculated by useEffect
    }
  };

  // Calculate estimated output in real-time as user types
  useEffect(() => {
    const calculateEstimate = async () => {
      if (!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) <= 0) {
        setBuyAmount('');
        setIsCalculatingOutput(false);
        return;
      }

      if (sellToken.address.toLowerCase() === buyToken.address.toLowerCase()) {
        setBuyAmount('');
        setIsCalculatingOutput(false);
        return;
      }

      setIsCalculatingOutput(true);

      try {
        // Get router address
        const routerAddress = (Contracts as Record<number, { scaleXRouterAddress?: string }>)[chainId]?.scaleXRouterAddress;

        if (!routerAddress || !hasProvider) {
          console.warn('Router address or provider not available');
          setIsCalculatingOutput(false);
          return;
        }

        // Import viem functions
        const { createPublicClient, http, parseUnits, formatUnits, getAddress } = await import('viem');
        const { baseSepolia } = await import('viem/chains');

        // Create public client for reading
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        // Import ScaleXRouterABI
        const { ScaleXRouterABI } = await import('@/configs/contracts');

        const srcAmountWei = parseUnits(sellAmount, sellToken.decimals);
        const srcAddress = getAddress(sellToken.address);
        const dstAddress = getAddress(buyToken.address);

        // Call calculateMinOutForSwap
        const minOut = await publicClient.readContract({
          address: routerAddress as `0x${string}`,
          abi: ScaleXRouterABI,
          functionName: 'calculateMinOutForSwap',
          args: [srcAddress, dstAddress, srcAmountWei, BigInt(slippageBps)],
        }) as bigint;

        if (minOut > 0n) {
          const estimatedAmount = formatUnits(minOut, buyToken.decimals);
          setBuyAmount(estimatedAmount);
        } else {
          setBuyAmount('');
        }
      } catch (error) {
        console.error('Failed to calculate estimate:', error);
        setBuyAmount('');
      } finally {
        setIsCalculatingOutput(false);
      }
    };

    // Debounce the calculation
    const timeoutId = setTimeout(() => {
      calculateEstimate();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [sellAmount, sellToken, buyToken, slippageBps, chainId, hasProvider]);

  // Also update from estimatedOutput when swap executes (backup)
  useEffect(() => {
    if (estimatedOutput && !isCalculatingOutput) {
      setBuyAmount(estimatedOutput);
    }
  }, [estimatedOutput, isCalculatingOutput]);

  // Check if user has sufficient balance
  const getSufficientBalanceStatus = () => {
    if (!isAuthenticated) {
      return { isDisabled: true, buttonText: 'CONNECT WALLET' };
    }

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      return { isDisabled: true, buttonText: 'ENTER AN AMOUNT' };
    }

    if (!sellToken || !buyToken) {
      return { isDisabled: true, buttonText: 'SELECT TOKENS' };
    }

    if (sellToken.address.toLowerCase() === buyToken.address.toLowerCase()) {
      return { isDisabled: true, buttonText: 'INVALID TOKEN PAIR' };
    }

    if (sellToken) {
      const balance = getRawTokenBalance(sellToken.symbol);
      const amount = parseFloat(sellAmount);

      if (amount > balance) {
        return { isDisabled: true, buttonText: `INSUFFICIENT ${sellToken.symbol}` };
      }
    }

    if (isPending || isConfirming) {
      return { isDisabled: true, buttonText: getSwapStepLabel(currentStep).toUpperCase() };
    }

    return { isDisabled: false, buttonText: 'SWAP' };
  };

  const balanceStatus = getSufficientBalanceStatus();

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-4">
        {/* Swap Container with Floating Arrow */}
        <div className="relative">
          {/* Sell Section */}
          <div className={`relative bg-[#1A1A1A]/50 rounded-2xl p-4 border transition-all ${
            isSellInputFocused ? 'border-[#F06718] shadow-[0_0_10px_rgba(240,103,24,0.3)]' : 'border-[#E0E0E0]/10'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#A0A0A0] text-sm">Sell</span>
              <div className="flex items-center gap-2">
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
              />

              <div className="flex-1 flex flex-col items-end min-w-0">
                <input
                  type="text"
                  value={sellAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setSellAmount(value);
                    }
                  }}
                  onFocus={() => setIsSellInputFocused(true)}
                  onBlur={() => setIsSellInputFocused(false)}
                  placeholder="0"
                  disabled={isPending || isConfirming}
                  className="w-full bg-transparent text-right text-2xl py-2 font-bold text-[#E0E0E0] outline-none disabled:opacity-50 overflow-hidden text-ellipsis"
                />
                {sellToken && (
                  <span className="text-sm text-[#A0A0A0] mt-1 whitespace-nowrap">
                    Balance: {getTokenBalance(sellToken.symbol)} {sellToken.symbol}
                  </span>
                )}
              </div>
            </div>

            {/* Flip Tokens Button - Floating */}
            <div className="absolute left-1/2 -bottom-5 -translate-x-1/2 z-10">
              <button
                type="button"
                onClick={handleFlipTokens}
                onMouseEnter={() => setIsFlipButtonHovered(true)}
                onMouseLeave={() => setIsFlipButtonHovered(false)}
                disabled={isPending || isConfirming}
                className="p-3 rounded-xl bg-[#1A1A1A] border border-[#E0E0E0]/20 hover:bg-[#252525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
              >
                {isFlipButtonHovered ? (
                  <ArrowUp className="w-5 h-3 text-[#E0E0E0]" />
                ) : (
                  <ArrowDown className="w-5 h-3 text-[#E0E0E0]" />
                )}
              </button>
            </div>
          </div>

          {/* Buy Section */}
          <div className="bg-[#1A1A1A]/50 rounded-2xl p-4 border border-[#E0E0E0]/10 mt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#A0A0A0] text-sm">Buy</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <TokenSelector
                selectedToken={buyToken}
                tokens={availableTokens}
                onSelect={setBuyToken}
              />

              <div className="flex-1 flex flex-col items-end min-w-0">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={buyAmount}
                    placeholder="0"
                    className="w-full bg-transparent text-right text-2xl py-2 font-bold text-[#A0A0A0] outline-none overflow-hidden text-ellipsis"
                    readOnly
                  />
                  {isCalculatingOutput && (
                    <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 text-[#4ADE80] animate-spin" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info and Status */}
        <div className="space-y-2">
          {/* Slippage Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#A0A0A0]">Slippage Tolerance</span>
            <span className="text-[#E0E0E0]">{formatSlippage(slippageBps)}</span>
          </div>

          {/* Status Messages */}
          {isPending && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-sm text-blue-400">{getSwapStepLabel(currentStep)}...</span>
            </div>
          )}

          {swapError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Swap Failed</p>
                <p className="text-xs text-red-400/80 mt-0.5">{swapError.message}</p>
              </div>
            </div>
          )}

          {isConfirmed && hash && (
            <div className="flex items-center gap-2 p-3 mb-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-400">Swap Successful!</p>
                <a
                  href={getBlockExplorerTxUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-300 hover:text-green-200 underline break-all mt-0.5 block"
                >
                  {hash}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Swap Execute Button */}
      <button
        type="button"
        onClick={handleExecuteSwap}
        disabled={balanceStatus.isDisabled}
        className="w-full py-3 font-bold text-lg bg-[#4ADE80] hover:bg-[#4ADE80]/80 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4ADE80] uppercase flex items-center justify-center gap-2"
      >
        {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
        {balanceStatus.buttonText}
      </button>
    </div>
  );
}

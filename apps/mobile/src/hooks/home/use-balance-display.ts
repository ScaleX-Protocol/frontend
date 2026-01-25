import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWalletState, useCurrencies } from '~/src/hooks/wallet';
import { useAccount } from '~/src/hooks/trading';
import type { Balance as TradingBalance } from '@scalex/types';

interface UseBalanceDisplayReturn {
  totalBalance: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  isConnected: boolean;
}

interface LocalBalance {
  asset?: string;
  symbol?: string;
  free?: string;
  available?: string;
}

// Convert TradingBalance (with number free) to LocalBalance (with string free)
function convertBalance(balance: TradingBalance): LocalBalance {
  return {
    asset: balance.asset,
    free: balance.free.toString(),
    available: balance.free.toString(),
  };
}

export function useBalanceDisplay(): UseBalanceDisplayReturn {
  const { isConnected, embeddedWallet } = useWalletState();
  const walletAddress = embeddedWallet?.address;

  // Fetch account information with balances
  const {
    data: accountData,
    isLoading: isAccountLoading,
    isError: isAccountError,
    refetch: refetchAccount,
  } = useAccount(
    walletAddress || '',
    {
      enabled: isConnected && !!walletAddress,
    }
  );

  // Fetch currencies data for price information
  const { data: currenciesData } = useCurrencies({
    onlyActual: true,
  });

  // Convert balances and calculate total USD value
  const totalBalance = useMemo(() => {
    if (!accountData?.balances || accountData.balances.length === 0) {
      return 0;
    }

    // Convert TradingBalance[] to LocalBalance[]
    const convertedBalances: LocalBalance[] = accountData.balances.map(convertBalance);

    // Find quote currency (usually USDC/USDT)
    const quoteCurrency = 'USDC'; // or use TradingConfig.quoteCurrency
    const quoteBalance = convertedBalances.find(
      (balance) => balance.asset === quoteCurrency || balance.symbol === quoteCurrency
    );

    const quoteFree = parseFloat(quoteBalance?.free || quoteBalance?.available || '0');

    // For now, return the quote currency balance
    // In a real implementation, you'd:
    // 1. Fetch prices for each token
    // 2. Convert all balances to USD
    // 3. Sum them up
    let total = quoteFree;

    // Add other token balances (simplified - assuming 1:1 for demo)
    convertedBalances.forEach((balance) => {
      if (balance.asset !== quoteCurrency && balance.symbol !== quoteCurrency) {
        const balanceValue = parseFloat(balance.free || balance.available || '0');
        // TODO: Fetch actual token price and multiply
        total += balanceValue;
      }
    });

    return total;
  }, [accountData]);

  // Refetch function to refresh data
  const refetch = useCallback(() => {
    if (isConnected && walletAddress) {
      refetchAccount();
    }
  }, [isConnected, walletAddress, refetchAccount]);

  return {
    totalBalance,
    isLoading: isAccountLoading,
    isError: isAccountError,
    refetch,
    isConnected,
  };
}

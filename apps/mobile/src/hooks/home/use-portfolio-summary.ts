import * as React from 'react';
import { useAccount, useTicker24hr } from '~/src/hooks/trading';
import { useCurrencies, useWalletState } from '~/src/hooks/wallet';

export interface Asset {
  symbol: string;
  amount: number;
  usdValue: number;
}

interface UsePortfolioSummaryResult {
  assets: Asset[];
  isLoading: boolean;
  isFetching: boolean;
  isConnected: boolean;
  refetch: () => void;
}

export function usePortfolioSummary(): UsePortfolioSummaryResult {
  const { isConnected, embeddedWallet } = useWalletState();
  const walletAddress = embeddedWallet?.address;

  // Fetch currencies data for decimals and prices
  const { data: currenciesData } = useCurrencies({
    onlyActual: true,
  });

  // Fetch account information with balances
  const {
    data: accountData,
    isLoading: isAccountLoading,
    isFetching: isAccountFetching,
    refetch: refetchAccount,
  } = useAccount(
    walletAddress || '',
    {
      enabled: isConnected && !!walletAddress,
    }
  );

  // Get non-zero balances
  const nonZeroBalances = React.useMemo(() => {
    if (!accountData?.balances) {
      return [];
    }

    return accountData.balances.filter(
      (balance) => balance.free > 0
    );
  }, [accountData]);

  // Fetch ticker data for each asset to get USD price
  const symbols = React.useMemo(
    () => nonZeroBalances.map((b) => b.asset).filter(Boolean),
    [nonZeroBalances]
  );

  // Create ticker queries for each symbol
  const tickerQueries = symbols.map((symbol) => {
    const { data: tickerData } = useTicker24hr(symbol);
    return { symbol, tickerData };
  });

  // Process assets with USD values
  const assets = React.useMemo<Asset[]>(() => {
    if (nonZeroBalances.length === 0) {
      return [];
    }

    return nonZeroBalances
      .map((balance) => {
        const symbol = balance.asset;
        if (!symbol) return null;

        const balanceValue = balance.free;

        // Find currency data to get decimals
        const currencyData = currenciesData?.data?.items?.find(
          (c: any) => c.symbol === symbol
        );

        // Get decimals from currency data
        const decimals = currencyData?.decimals || 18;

        // Convert balance to human-readable format (accounting data is already in human format)
        const formattedBalance = balanceValue;

        // Find ticker data for this symbol
        const tickerQuery = tickerQueries.find((q) => q.symbol === symbol);
        const lastPrice = tickerQuery?.tickerData?.lastPrice;

        // Calculate USD value
        // If we have ticker data, use lastPrice
        let usdPrice = 0;
        if (lastPrice) {
          usdPrice = parseFloat(lastPrice);
        }

        // Calculate USD value
        const usdValue = formattedBalance * usdPrice;

        return {
          symbol,
          amount: formattedBalance,
          usdValue,
        };
      })
      .filter((asset): asset is Asset => asset !== null && asset.amount > 0)
      .sort((a, b) => b.usdValue - a.usdValue);
  }, [nonZeroBalances, tickerQueries, currenciesData]);

  // Refetch function to refresh data
  const refetch = React.useCallback(() => {
    if (isConnected && walletAddress) {
      refetchAccount();
    }
  }, [isConnected, walletAddress, refetchAccount]);

  return {
    assets,
    isLoading: isAccountLoading,
    isFetching: isAccountFetching,
    isConnected: !!isConnected && !!walletAddress,
    refetch,
  };
}

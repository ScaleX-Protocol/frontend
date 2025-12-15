'use client';

import { useMemo } from 'react';
import { TradingConfig } from '@/configs/trading';
import { useLogger } from '../useLogger';
import { LogLevel, LogLabel, ServiceName } from '../../utils/logger';

interface Balance {
  asset?: string;
  symbol?: string;
  free?: string;
  available?: string;
}

interface UseTradeBalancesOptions {
  accountBalances?: Balance[];
  currenciesData?: any;
  baseCurrencySymbol?: string;
}

export function useTradeBalances({ accountBalances, currenciesData, baseCurrencySymbol }: UseTradeBalancesOptions) {
  const logger = useLogger();
  const balances = useMemo(() => {
    if (!accountBalances) {
      logger.log(LogLevel.INFO, 'No account balances available', LogLabel.BALANCE, ServiceName.TRADING_UI, {}, 'useTradeBalances.ts', 'useTradeBalances');
      return {
        quoteCurrencyBalance: '0',
        baseCurrencyBalance: '0',
        rawBalances: [],
      };
    }

    const quoteCurrency = TradingConfig.quoteCurrency;

    // Find quote currency balance
    const quoteBalance = accountBalances.find(
      (balance) => balance.asset === quoteCurrency || balance.symbol === quoteCurrency
    );

    const quoteFreeRaw = parseFloat(quoteBalance?.free || quoteBalance?.available || '0');

    // Find quote currency metadata to get decimals
    const quoteCurrencyData = currenciesData?.data?.items?.find(
      (c: any) => c.symbol === quoteCurrency
    );
    const quoteDecimals = quoteCurrencyData?.decimals || 6; // Default to 6 for USDC-like tokens

    // Convert raw balance to human-readable format
    const quoteFreeFormatted = quoteFreeRaw / Math.pow(10, quoteDecimals);

    logger.log(LogLevel.INFO, `Quote currency (${quoteCurrency}) balance: ${quoteFreeFormatted.toFixed(2)}`, LogLabel.BALANCE, ServiceName.TRADING_UI, { quoteCurrency, balance: quoteFreeFormatted.toFixed(2) }, 'useTradeBalances.ts', 'useTradeBalances');

    // Find base currency balance if symbol is provided
    let baseFreeFormatted = 0;
    if (baseCurrencySymbol) {
      const baseBalance = accountBalances.find(
        (balance) => balance.asset === baseCurrencySymbol || balance.symbol === baseCurrencySymbol
      );

      const baseFreeRaw = parseFloat(baseBalance?.free || baseBalance?.available || '0');

      // Find base currency metadata to get decimals
      const baseCurrencyData = currenciesData?.data?.items?.find(
        (c: any) => c.symbol === baseCurrencySymbol
      );
      const baseDecimals = baseCurrencyData?.decimals || 18; // Default to 18 for ETH-like tokens

      baseFreeFormatted = baseFreeRaw / Math.pow(10, baseDecimals);

      logger.log(LogLevel.INFO, `Base currency (${baseCurrencySymbol}) balance: ${baseFreeFormatted.toFixed(6)}`, LogLabel.BALANCE, ServiceName.TRADING_UI, { baseCurrencySymbol, balance: baseFreeFormatted.toFixed(6) }, 'useTradeBalances.ts', 'useTradeBalances');
    }

    return {
      quoteCurrencyBalance: quoteFreeFormatted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      quoteCurrencyBalanceRaw: quoteFreeRaw,
      baseCurrencyBalance: baseFreeFormatted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }),
      baseCurrencyBalanceRaw: baseFreeFormatted,
      rawBalances: accountBalances,
    };
  }, [accountBalances, currenciesData, baseCurrencySymbol]);

  return balances;
}

// Utility function to format balance for display
export function formatBalance(balance: string | number, decimals: number = 2): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;

  if (isNaN(num)) {
    return '0.00';
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Utility function to check if user has sufficient balance
export function hasSufficientBalance(
  required: string | number,
  available: string | number
): boolean {
  const requiredNum = typeof required === 'string' ? parseFloat(required) : required;
  const availableNum = typeof available === 'string' ? parseFloat(available) : available;

  if (isNaN(requiredNum) || isNaN(availableNum)) {
    return false;
  }

  return availableNum >= requiredNum;
}

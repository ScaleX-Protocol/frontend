import { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import {
  usePrivyPlaceOrder,
  OrderSide,
  TimeInForce,
  type Pool,
  useTradeBalances,
  useTradingRules,
} from '~/src/hooks/trading';
import {
  createOrderFormSchema,
  type OrderFormSchema,
} from '~/src/components/features/trade/order-validation';

const TRADING_FEE_PERCENTAGE = 0.001; // 0.1% fee

export interface UsePlaceOrderParams {
  baseTokenAddress: string;
  quoteTokenAddress: string;
  baseTokenSymbol: string;
  quoteTokenSymbol: string;
  baseTokenDecimals?: number;
  quoteTokenDecimals?: number;
  accountBalances?: any[];
  currenciesData?: any;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePlaceOrder({
  baseTokenAddress,
  quoteTokenAddress,
  baseTokenSymbol,
  quoteTokenSymbol,
  baseTokenDecimals = 18,
  quoteTokenDecimals = 6,
  accountBalances,
  currenciesData,
  onSuccess,
  onError,
}: UsePlaceOrderParams) {
  // Get trading rules
  const { tradingRules } = useTradingRules({
    baseTokenAddress,
    quoteTokenAddress,
  });

  // Get balances
  const {
    quoteCurrencyBalance,
    quoteCurrencyBalanceRaw,
    baseCurrencyBalance,
    baseCurrencyBalanceRaw,
  } = useTradeBalances({
    accountBalances,
    currenciesData,
    baseCurrencySymbol: baseTokenSymbol,
  });

  // Place order mutation
  const { placeMarketOrder, placeLimitOrder, isPending, error } =
    usePrivyPlaceOrder({
      onSuccess: (hash) => {
        Alert.alert('Success', 'Order placed successfully!');
        onSuccess?.();
      },
      onError: (error) => {
        Alert.alert('Error', error.message);
        onError?.(error);
      },
    });

  // Create dynamic validation schema based on trading rules and balance
  const schema = useMemo(() => {
    const balanceForSide = (side: 'buy' | 'sell') => {
      if (side === 'buy') {
        return parseFloat((quoteCurrencyBalanceRaw ?? 0).toString());
      }
      return baseCurrencyBalanceRaw ?? 0;
    };

    return createOrderFormSchema(tradingRules, balanceForSide('buy'));
  }, [tradingRules, quoteCurrencyBalanceRaw, baseCurrencyBalanceRaw]);

  // Initialize form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<OrderFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      side: 'buy',
      orderType: 'market',
      amount: '',
      price: '',
    },
    mode: 'onChange',
  });

  // Watch form values
  const formValues = watch();
  const { side, orderType, amount, price } = formValues;

  // Calculate total and fee
  const calculations = useMemo(() => {
    const amountNum = parseFloat(amount) || 0;
    const priceNum = parseFloat(price) || 0;

    let total = 0;
    let fee = 0;

    if (orderType === 'limit' && priceNum > 0) {
      // For limit orders: total = amount × price
      total = amountNum * priceNum;
      fee = total * TRADING_FEE_PERCENTAGE;
    } else if (orderType === 'market' && amountNum > 0) {
      // For market orders: total = amount (will be executed at market price)
      // Fee will be calculated based on execution price
      total = amountNum;
      fee = total * TRADING_FEE_PERCENTAGE;
    } else if (orderType === 'swap' && amountNum > 0) {
      // For swap orders
      total = amountNum;
      fee = total * TRADING_FEE_PERCENTAGE;
    }

    return {
      total,
      fee,
      totalWithFee: total + fee,
    };
  }, [amount, price, orderType]);

  // Get available balance based on side
  const availableBalance = useMemo(() => {
    if (side === 'buy') {
      return quoteCurrencyBalanceRaw;
    }
    return baseCurrencyBalanceRaw;
  }, [side, quoteCurrencyBalanceRaw, baseCurrencyBalanceRaw]);

  // Get available balance formatted string
  const availableBalanceFormatted = useMemo(() => {
    if (side === 'buy') {
      return quoteCurrencyBalance;
    }
    return baseCurrencyBalance;
  }, [side, quoteCurrencyBalance, baseCurrencyBalance]);

  // Submit handler
  const onSubmit = useCallback(async (data: OrderFormSchema) => {
    try {
      const pool: Pool = {
        base: baseTokenAddress,
        quote: quoteTokenAddress,
        spacing: 1,
        fee: 0,
      };

      const orderSide = data.side === 'buy' ? OrderSide.BUY : OrderSide.SELL;
      const amountNum = parseFloat(data.amount);
      const priceNum = parseFloat(data.price || '0');

      if (data.orderType === 'market') {
        await placeMarketOrder({
          pool,
          quantity: data.amount,
          side: orderSide,
          depositAmount: '0', // Assuming funds are already deposited
          quantityDecimals: baseTokenDecimals,
          depositDecimals: quoteTokenDecimals,
        });
      } else if (data.orderType === 'limit') {
        await placeLimitOrder({
          pool,
          price: data.price || '0',
          quantity: data.amount,
          side: orderSide,
          timeInForce: TimeInForce.GTC,
          depositAmount: '0',
          quantityDecimals: baseTokenDecimals,
          depositDecimals: quoteTokenDecimals,
          priceDecimals: quoteTokenDecimals,
        });
      } else if (data.orderType === 'swap') {
        // Swap is similar to market order
        await placeMarketOrder({
          pool,
          quantity: data.amount,
          side: orderSide,
          depositAmount: '0',
          quantityDecimals: baseTokenDecimals,
          depositDecimals: quoteTokenDecimals,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      onError?.(error);
    }
  }, [
    baseTokenAddress,
    quoteTokenAddress,
    baseTokenDecimals,
    quoteTokenDecimals,
    placeMarketOrder,
    placeLimitOrder,
    onSuccess,
    onError,
  ]);

  return {
    // Form control
    control,
    errors,
    isValid,
    watch,

    // Form handlers
    handleSubmit,
    onSubmit,

    // Calculations
    availableBalance,
    availableBalanceFormatted,
    calculations,

    // Loading state
    isLoading: isPending,

    // Error
    error,

    // Trading rules
    tradingRules,
  };
}

import { z } from 'zod';

export interface TradingRules {
  minOrderSize?: number;
  maxOrderSize?: number;
  minPrice?: number;
  maxPrice?: number;
  pricePrecision?: number;
  quantityPrecision?: number;
}

export const createOrderFormSchema = (
  tradingRules?: TradingRules,
  availableBalance?: number
) => {
  return z.object({
    side: z.enum(['buy', 'sell']),
    orderType: z.enum(['market', 'limit', 'swap']),
    amount: z.string().refine((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) return false;
      if (tradingRules?.minOrderSize && num < tradingRules.minOrderSize) return false;
      if (tradingRules?.maxOrderSize && num > tradingRules.maxOrderSize) return false;
      if (availableBalance !== undefined && num > availableBalance) return false;
      return true;
    }, {
      message: 'Invalid amount',
    }),
    price: z.string().optional().refine((val) => {
      if (!val) return true; // Price is optional for market orders
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) return false;
      if (tradingRules?.minPrice && num < tradingRules.minPrice) return false;
      if (tradingRules?.maxPrice && num > tradingRules.maxPrice) return false;
      return true;
    }, {
      message: 'Invalid price',
    }),
  });
};

export type OrderFormSchema = z.infer<ReturnType<typeof createOrderFormSchema>>;

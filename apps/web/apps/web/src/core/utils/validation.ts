/**
 * Centralized Validation Utilities
 * Consolidates all validation logic from scattered utility files
 */

import { z } from 'zod';

// Common validation schemas
export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

export const amountSchema = z.string().min(0.00000001, 'Amount must be positive');

export const tokenAmountSchema = z.object({
  amount: amountSchema,
  decimals: z.number().min(0).max(78),
  symbol: z.string().min(1).max(20),
});

// Common validation functions
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
}

export function validateTokenAmount(amount: string | number, decimals: number, symbol: string): {
  isValid: boolean;
  formattedAmount?: string;
  error?: string;
} {
  try {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      return { isValid: false, error: 'Invalid amount: not a number' };
    }

    if (numAmount <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }

    if (decimals < 0 || decimals > 78) {
      return { isValid: false, error: 'Invalid decimal places' };
    }

    if (!symbol || symbol.length === 0) {
      return { isValid: false, error: 'Token symbol is required' };
    }

    // Check if amount has too many decimal places
    const decimalPart = numAmount.toString().split('.')[1];
    if (decimalPart && decimalPart.length > decimals) {
      return {
        isValid: false,
        error: `Amount cannot have more than ${decimals} decimal places`
      };
    }

    return {
      isValid: true,
      formattedAmount: numAmount.toFixed(decimals)
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

export function validateDepositParams(params: {
  tokenAddress: string;
  amount: string | number;
  decimals: number;
}) {
  return tokenAmountSchema.parse({
    amount: params.amount,
    decimals: params.decimals,
    symbol: params.tokenAddress, // Using address as symbol for validation
  });
}

export function validateWithdrawParams(params: {
  tokenAddress: string;
  amount: string | number;
  decimals: number;
}) {
  return tokenAmountSchema.parse({
    amount: params.amount,
    decimals: params.decimals,
    symbol: params.tokenAddress,
  });
}

export function validateBorrowParams(params: {
  tokenAddress: string;
  amount: string | number;
  decimals: number;
}) {
  return tokenAmountSchema.parse({
    amount: params.amount,
    decimals: params.decimals,
    symbol: params.tokenAddress,
  });
}

export function validateRepayParams(params: {
  tokenAddress: string;
  amount: string | number;
  decimals: number;
}) {
  return tokenAmountSchema.parse({
    amount: params.amount,
    decimals: params.decimals,
    symbol: params.tokenAddress,
  });
}

// Generic validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: any;
}

// Generic validator function
export function createValidator<T>(
  schema: z.ZodSchema<T>
): (data: unknown) => ValidationResult {
  return (data: unknown): ValidationResult => {
    try {
      const result = schema.parse(data);
      return { isValid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors.map(e => e.message).join(', ')
        };
      }
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  };
}

// Pre-built validators
export const validateAddress = createValidator(addressSchema);
export const validateAmount = createValidator(amountSchema);
export const validateTokenAmountWithSchema = createValidator(tokenAmountSchema);
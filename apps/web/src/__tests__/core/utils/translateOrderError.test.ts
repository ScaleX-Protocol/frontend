import { describe, it, expect } from 'vitest';
import { translateOrderError } from '@/core/utils/web3';

// ─── POSITIVE TESTS (happy path — known errors return correct human messages) ───

describe('✅ Positive — OrderBook errors map to human messages', () => {
  it('OrderHasNoLiquidity → message mentions "order book is empty" and suggests limit order', () => {
    const error = { cause: { data: { errorName: 'OrderHasNoLiquidity' } } };
    const msg = translateOrderError(error);
    expect(msg).toContain('order book is empty');
    expect(msg.toLowerCase()).toContain('limit order');
  });

  it('SlippageTooHigh → message mentions "price moved"', () => {
    const error = { cause: { data: { errorName: 'SlippageTooHigh' } } };
    const msg = translateOrderError(error);
    expect(msg.toLowerCase()).toContain('price moved');
  });

  it('SlippageExceeded → message mentions "slipped" or "range"', () => {
    const error = { cause: { data: { errorName: 'SlippageExceeded' } } };
    expect(translateOrderError(error).toLowerCase()).toMatch(/slipp(ed|age)/);
  });

  it('FillOrKillNotFulfilled → message mentions "GTC" or "liquidity"', () => {
    const error = { cause: { data: { errorName: 'FillOrKillNotFulfilled' } } };
    const msg = translateOrderError(error);
    expect(msg).toMatch(/GTC|liquidity/i);
  });

  it('PostOnlyWouldTake → message mentions "Post-Only"', () => {
    const error = { cause: { data: { errorName: 'PostOnlyWouldTake' } } };
    const msg = translateOrderError(error);
    expect(msg).toMatch(/post.only/i);
  });

  it('TradingPaused → message tells user trading is paused and to try later', () => {
    const error = { cause: { data: { errorName: 'TradingPaused' } } };
    const msg = translateOrderError(error);
    expect(msg.toLowerCase()).toContain('paused');
    expect(msg.toLowerCase()).toContain('try again');
  });

  it('OrderTooSmall → message mentions "5 USDC" minimum', () => {
    const error = { cause: { data: { errorName: 'OrderTooSmall' } } };
    expect(translateOrderError(error)).toContain('5 USDC');
  });

  it('OrderTooLarge → message suggests splitting orders', () => {
    const error = { cause: { data: { errorName: 'OrderTooLarge' } } };
    const msg = translateOrderError(error);
    expect(msg.toLowerCase()).toContain('split');
  });

  it('InvalidPrice → message tells user price must be > zero', () => {
    const error = { cause: { data: { errorName: 'InvalidPrice' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('price');
  });

  it('InvalidPriceIncrement → message mentions tick or increment', () => {
    const error = { cause: { data: { errorName: 'InvalidPriceIncrement' } } };
    expect(translateOrderError(error).toLowerCase()).toMatch(/tick|increment/);
  });

  it('InvalidQuantity → message says amount cannot be zero', () => {
    const error = { cause: { data: { errorName: 'InvalidQuantity' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('zero');
  });

  it('InvalidQuantityIncrement → message tells user to adjust amount', () => {
    const error = { cause: { data: { errorName: 'InvalidQuantityIncrement' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('adjust');
  });

  it('NegativeSpreadCreated → message explains buy/sell spread positioning', () => {
    const error = { cause: { data: { errorName: 'NegativeSpreadCreated' } } };
    const msg = translateOrderError(error);
    expect(msg.toLowerCase()).toContain('spread');
    expect(msg.toLowerCase()).toContain('buy');
    expect(msg.toLowerCase()).toContain('sell');
  });

  it('AutoRepayOnlyForBuyOrders → message says to disable Auto-Repay', () => {
    const error = { cause: { data: { errorName: 'AutoRepayOnlyForBuyOrders' } } };
    expect(translateOrderError(error)).toMatch(/auto.repay/i);
  });

  it('AutoBorrowOnlyForSellOrders → message says to disable Auto-Borrow', () => {
    const error = { cause: { data: { errorName: 'AutoBorrowOnlyForSellOrders' } } };
    expect(translateOrderError(error)).toMatch(/auto.borrow/i);
  });
});

describe('✅ Positive — Balance / ERC20 errors map to human messages', () => {
  it('ERC20InsufficientAllowance → message mentions approval', () => {
    const error = { cause: { data: { errorName: 'ERC20InsufficientAllowance' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('approv');
  });

  it('ERC20InsufficientBalance → message mentions wallet balance', () => {
    const error = { cause: { data: { errorName: 'ERC20InsufficientBalance' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('wallet');
  });

  it('InsufficientSwapBalance → message tells user to deposit', () => {
    const error = { cause: { data: { errorName: 'InsufficientSwapBalance' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('deposit');
  });

  it('ZeroAmount → message says amount cannot be zero', () => {
    const error = { cause: { data: { errorName: 'ZeroAmount' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('zero');
  });

  it('InsufficientBalance → message mentions deposit and Auto-Borrow', () => {
    const error = { cause: { data: { errorName: 'InsufficientBalance' } } };
    const msg = translateOrderError(error).toLowerCase();
    expect(msg).toContain('deposit');
    expect(msg).toMatch(/auto.borrow/i);
  });
});

describe('✅ Positive — Lending errors map to human messages', () => {
  it('InsufficientHealthFactorForBorrow → message warns about liquidation', () => {
    const error = { cause: { data: { errorName: 'InsufficientHealthFactorForBorrow' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('liquidation');
  });

  it('InsufficientLiquidity → message mentions lending pool', () => {
    const error = { cause: { data: { errorName: 'InsufficientLiquidity' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('lending pool');
  });

  it('InsufficientCollateral → message says to deposit collateral', () => {
    const error = { cause: { data: { errorName: 'InsufficientCollateral' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('collateral');
  });

  it('InvalidAmount → message says to enter a positive number', () => {
    const error = { cause: { data: { errorName: 'InvalidAmount' } } };
    expect(translateOrderError(error).toLowerCase()).toContain('positive');
  });
});

describe('✅ Positive — Viem error chain paths all resolve correctly', () => {
  it('extracts from error.cause.data.errorName (ContractFunctionRevertedError path)', () => {
    const error = {
      name: 'ContractFunctionExecutionError',
      cause: {
        name: 'ContractFunctionRevertedError',
        data: { errorName: 'TradingPaused' },
      },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('paused');
  });

  it('extracts from error.cause.name when data.errorName is absent', () => {
    const error = {
      name: 'ContractFunctionExecutionError',
      cause: { name: 'OrderHasNoLiquidity' },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('order book');
  });

  it('extracts from error.data.errorName at top level', () => {
    const error = { data: { errorName: 'OrderTooSmall' } };
    expect(translateOrderError(error)).toContain('5 USDC');
  });

  it('extracts from deeply nested cause chain (3 levels)', () => {
    const error = {
      name: 'ContractFunctionExecutionError',
      cause: {
        name: 'ContractFunctionRevertedError',
        cause: {
          name: 'BaseError',
          cause: { data: { errorName: 'SlippageTooHigh' } },
        },
      },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('price moved');
  });

  it('user rejection detected from message string', () => {
    const error = { message: 'User rejected the request.' };
    expect(translateOrderError(error).toLowerCase()).toContain('cancelled');
  });

  it('user denial detected from "denied" keyword', () => {
    const error = { message: 'MetaMask Tx Signature: User denied transaction signature.' };
    expect(translateOrderError(error).toLowerCase()).toContain('cancelled');
  });
});

// ─── NEGATIVE TESTS (inputs that should NOT match known errors → fallback) ───

describe('❌ Negative — Unknown or unrecognized errors fall back gracefully', () => {
  it('unknown contract error name returns generic fallback message', () => {
    const error = { cause: { data: { errorName: 'SomeNewUnknownError' } } };
    const msg = translateOrderError(error);
    expect(msg).toBeTruthy();
    expect(msg).not.toContain('SomeNewUnknownError');
  });

  it('plain Error object with no contract info returns fallback', () => {
    const error = new Error('internal server error');
    const msg = translateOrderError(error);
    expect(msg).toBeTruthy();
    expect(msg.toLowerCase()).not.toContain('internal server');
  });

  it('error with only a hex data payload returns fallback', () => {
    const error = { data: '0x12345678' };
    const msg = translateOrderError(error);
    expect(msg).toBeTruthy();
    expect(msg).not.toContain('0x');
  });

  it('error with empty cause chain returns fallback', () => {
    const error = { name: 'ContractFunctionExecutionError', cause: null };
    const msg = translateOrderError(error);
    expect(msg).toBeTruthy();
  });

  it('error with message containing "insufficient funds" (gas) returns gas message', () => {
    const error = { message: 'insufficient funds for gas * price + value' };
    expect(translateOrderError(error).toLowerCase()).toContain('gas');
  });
});

// ─── EDGE TESTS (boundary conditions, malformed inputs, extreme values) ───

describe('⚠️ Edge — Malformed and extreme inputs', () => {
  it('null input returns non-empty fallback without throwing', () => {
    expect(() => translateOrderError(null)).not.toThrow();
    expect(translateOrderError(null)).toBeTruthy();
  });

  it('undefined input returns non-empty fallback without throwing', () => {
    expect(() => translateOrderError(undefined)).not.toThrow();
    expect(translateOrderError(undefined)).toBeTruthy();
  });

  it('string input (not an object) returns fallback without throwing', () => {
    expect(() => translateOrderError('raw string error')).not.toThrow();
    expect(translateOrderError('raw string error')).toBeTruthy();
  });

  it('number input returns fallback without throwing', () => {
    expect(() => translateOrderError(42)).not.toThrow();
  });

  it('circular reference in cause chain does not cause infinite loop', () => {
    const error: any = { name: 'Error', cause: null };
    error.cause = error; // circular
    expect(() => translateOrderError(error)).not.toThrow();
  });

  it('error with empty string errorName falls back gracefully', () => {
    const error = { cause: { data: { errorName: '' } } };
    expect(translateOrderError(error)).toBeTruthy();
  });

  it('error with errorName = null falls back gracefully', () => {
    const error = { cause: { data: { errorName: null } } };
    expect(translateOrderError(error)).toBeTruthy();
  });

  it('error with very long message string does not crash', () => {
    const error = { message: 'x'.repeat(10000) };
    expect(() => translateOrderError(error)).not.toThrow();
  });

  it('both rejection keyword and contract error name → rejection message wins', () => {
    const error = {
      message: 'User rejected the request.',
      cause: { data: { errorName: 'OrderHasNoLiquidity' } },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('cancelled');
  });

  it('error.cause.data exists but has no errorName property — falls through to name check', () => {
    const error = {
      cause: {
        name: 'SlippageTooHigh',
        data: { someOtherField: 'value' },
      },
    };
    expect(translateOrderError(error).toLowerCase()).toContain('price moved');
  });
});

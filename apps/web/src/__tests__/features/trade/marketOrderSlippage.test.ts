import { describe, it, expect } from 'vitest';
import { computeMinOutAmount } from '@/features/trade/utils/marketOrderSlippage';

// ─── POSITIVE TESTS (happy path — correct minOutAmount and decimals returned) ───

describe('✅ Positive — BUY orders use base token decimals', () => {
  it('returns estimatedOutput unchanged as minOutAmount for BUY side', () => {
    const { minOutAmount } = computeMinOutAmount('1.5', 0, 18, 6);
    expect(minOutAmount).toBe('1.5');
  });

  it('uses baseToken decimals (18) for BUY side', () => {
    const { minOutDecimals } = computeMinOutAmount('1.5', 0, 18, 6);
    expect(minOutDecimals).toBe(18);
  });

  it('BUY: base=8 decimals (e.g. WBTC), quote=6 decimals (USDC) → uses 8', () => {
    const { minOutDecimals } = computeMinOutAmount('0.001', 0, 8, 6);
    expect(minOutDecimals).toBe(8);
  });

  it('preserves decimal precision in minOutAmount string for BUY', () => {
    const { minOutAmount } = computeMinOutAmount('1234.567890', 0, 18, 6);
    expect(minOutAmount).toBe('1234.567890');
  });
});

describe('✅ Positive — SELL orders use quote token decimals', () => {
  it('returns estimatedOutput unchanged as minOutAmount for SELL side', () => {
    const { minOutAmount } = computeMinOutAmount('2500.00', 1, 18, 6);
    expect(minOutAmount).toBe('2500.00');
  });

  it('uses quoteToken decimals (6) for SELL side', () => {
    const { minOutDecimals } = computeMinOutAmount('2500.00', 1, 18, 6);
    expect(minOutDecimals).toBe(6);
  });

  it('SELL: base=18 (ETH), quote=18 (DAI) → uses 18', () => {
    const { minOutDecimals } = computeMinOutAmount('3000', 1, 18, 18);
    expect(minOutDecimals).toBe(18);
  });
});

// ─── NEGATIVE TESTS (conditions that should produce "0" — protection disabled) ───

describe('❌ Negative — Zero or unavailable estimate disables slippage protection', () => {
  it('returns "0" when estimatedOutput is "0"', () => {
    const { minOutAmount } = computeMinOutAmount('0', 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('returns "0" when estimatedOutput is empty string', () => {
    const { minOutAmount } = computeMinOutAmount('', 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('returns "0" when estimatedOutput is null', () => {
    const { minOutAmount } = computeMinOutAmount(null, 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('returns "0" when estimatedOutput is undefined', () => {
    const { minOutAmount } = computeMinOutAmount(undefined, 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('still returns correct decimals even when output is "0" (BUY)', () => {
    const { minOutDecimals } = computeMinOutAmount('0', 0, 18, 6);
    expect(minOutDecimals).toBe(18);
  });

  it('still returns correct decimals even when output is "0" (SELL)', () => {
    const { minOutDecimals } = computeMinOutAmount(null, 1, 18, 6);
    expect(minOutDecimals).toBe(6);
  });
});

// ─── EDGE TESTS (boundary values, precision, unusual inputs) ───

describe('⚠️ Edge — Boundary and precision cases', () => {
  it('handles very large number string without precision loss', () => {
    const bigNum = '999999999999999999';
    const { minOutAmount } = computeMinOutAmount(bigNum, 0, 18, 6);
    expect(minOutAmount).toBe(bigNum);
  });

  it('handles very small number string (near minimum token units)', () => {
    const { minOutAmount } = computeMinOutAmount('0.000000001', 0, 18, 6);
    expect(minOutAmount).toBe('0.000000001');
  });

  it('handles scientific notation string "1e-8" by treating as > 0', () => {
    const { minOutAmount } = computeMinOutAmount('1e-8', 0, 18, 6);
    expect(minOutAmount).toBe('1e-8');
  });

  it('handles NaN-producing string gracefully → returns "0"', () => {
    const { minOutAmount } = computeMinOutAmount('not-a-number', 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('handles negative estimatedOutput gracefully → returns "0"', () => {
    const { minOutAmount } = computeMinOutAmount('-100', 0, 18, 6);
    expect(minOutAmount).toBe('0');
  });

  it('side=0 (BUY) with equal base and quote decimals — still returns base decimals', () => {
    const { minOutDecimals } = computeMinOutAmount('100', 0, 18, 18);
    expect(minOutDecimals).toBe(18);
  });

  it('side=1 (SELL) with equal base and quote decimals — still returns quote decimals', () => {
    const { minOutDecimals } = computeMinOutAmount('100', 1, 18, 18);
    expect(minOutDecimals).toBe(18);
  });

  it('does not mutate the input estimatedOutput string', () => {
    const input = '500.123';
    computeMinOutAmount(input, 0, 18, 6);
    expect(input).toBe('500.123');
  });
});

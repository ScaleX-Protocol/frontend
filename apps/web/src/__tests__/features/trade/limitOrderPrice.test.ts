import { describe, it, expect } from 'vitest';
import { computeDefaultLimitPrice } from '@/features/trade/utils/limitOrderPrice';

// ─── POSITIVE TESTS (happy path — correct price returned and formatted) ───

describe('✅ Positive — BUY orders use bestBid or ticker fallback', () => {
  it('returns bestBid formatted for a whole-number price', () => {
    const result = computeDefaultLimitPrice('buy', 50000, null, null);
    expect(result).toBe('50000');
  });

  it('returns bestBid with decimals for prices >= 1', () => {
    const result = computeDefaultLimitPrice('buy', 1850.5, null, null);
    expect(result).toBe('1850.5');
  });

  it('returns bestBid with 8 decimal places for prices < 1', () => {
    const result = computeDefaultLimitPrice('buy', 0.00001234, null, null);
    expect(result).toBe('0.00001234');
  });

  it('returns ticker × 0.99 when bestBid is null', () => {
    const result = computeDefaultLimitPrice('buy', null, null, 100);
    expect(parseFloat(result!)).toBeCloseTo(99, 5);
  });

  it('prefers bestBid over ticker when both are available', () => {
    const result = computeDefaultLimitPrice('buy', 49500, 50100, 50500);
    expect(result).toBe('49500');
  });

  it('trailing zeros are removed from integer bestBid', () => {
    const result = computeDefaultLimitPrice('buy', 100.0, null, null);
    expect(result).not.toContain('.00');
    expect(result).toBe('100');
  });
});

describe('✅ Positive — SELL orders use bestAsk or ticker fallback', () => {
  it('returns bestAsk formatted for a standard price', () => {
    const result = computeDefaultLimitPrice('sell', null, 50100, null);
    expect(result).toBe('50100');
  });

  it('returns bestAsk with 8 decimal places for prices < 1', () => {
    const result = computeDefaultLimitPrice('sell', null, 0.00005678, null);
    expect(result).toBe('0.00005678');
  });

  it('returns ticker × 1.01 when bestAsk is null', () => {
    const result = computeDefaultLimitPrice('sell', null, null, 100);
    expect(parseFloat(result!)).toBeCloseTo(101, 5);
  });

  it('prefers bestAsk over ticker when both are available', () => {
    const result = computeDefaultLimitPrice('sell', 49800, 50100, 50000);
    expect(result).toBe('50100');
  });
});

// ─── NEGATIVE TESTS (conditions where null is the correct return value) ───

describe('❌ Negative — Returns null when no price data is available', () => {
  it('returns null for BUY when bestBid, bestAsk, and tickerPrice are all null', () => {
    expect(computeDefaultLimitPrice('buy', null, null, null)).toBeNull();
  });

  it('returns null for SELL when bestBid, bestAsk, and tickerPrice are all null', () => {
    expect(computeDefaultLimitPrice('sell', null, null, null)).toBeNull();
  });

  it('returns null when bestBid is 0 (treated as unavailable)', () => {
    expect(computeDefaultLimitPrice('buy', 0, null, null)).toBeNull();
  });

  it('returns null when bestAsk is 0 (treated as unavailable)', () => {
    expect(computeDefaultLimitPrice('sell', null, 0, null)).toBeNull();
  });

  it('returns null when tickerPrice is 0 (fallback also unavailable)', () => {
    expect(computeDefaultLimitPrice('buy', null, null, 0)).toBeNull();
  });

  it('BUY ignores bestAsk when bestBid is null and ticker is also null', () => {
    expect(computeDefaultLimitPrice('buy', null, 50100, null)).toBeNull();
  });

  it('SELL ignores bestBid when bestAsk is null and ticker is also null', () => {
    expect(computeDefaultLimitPrice('sell', 49800, null, null)).toBeNull();
  });
});

// ─── EDGE TESTS (boundary values, floating-point, extreme prices) ───

describe('⚠️ Edge — Boundary and extreme values', () => {
  it('handles very small price (1e-8) without scientific notation in output', () => {
    const result = computeDefaultLimitPrice('buy', 0.00000001, null, null);
    expect(result).not.toContain('e');
    expect(result).toBe('0.00000001');
  });

  it('handles very large price (BTC scenario, ~100000) with no decimal places', () => {
    const result = computeDefaultLimitPrice('buy', 100000, null, null);
    expect(result).toBe('100000');
  });

  it('ticker × 0.99 for price just above 1 (1.01 → ~0.9999) formats correctly', () => {
    const result = computeDefaultLimitPrice('buy', null, null, 1.01);
    expect(parseFloat(result!)).toBeCloseTo(0.9999, 4);
  });

  it('ticker × 1.01 for price just below 1 (0.99 → ~0.9999) formats correctly', () => {
    const result = computeDefaultLimitPrice('sell', null, null, 0.99);
    expect(parseFloat(result!)).toBeCloseTo(0.9999, 4);
  });

  it('negative bestBid is treated as invalid (returns null)', () => {
    expect(computeDefaultLimitPrice('buy', -100, null, null)).toBeNull();
  });

  it('negative tickerPrice fallback is treated as invalid (returns null)', () => {
    expect(computeDefaultLimitPrice('buy', null, null, -50000)).toBeNull();
  });

  it('floating-point precision: bestBid=0.3 does not produce extra digits', () => {
    const result = computeDefaultLimitPrice('buy', 0.3, null, null);
    expect(result).not.toContain('00000000000000');
  });

  it('BUY with bestBid=null, bestAsk=50100, ticker=50000: uses ticker×0.99, NOT bestAsk', () => {
    const result = computeDefaultLimitPrice('buy', null, 50100, 50000);
    expect(parseFloat(result!)).toBeCloseTo(49500, 0);
    expect(parseFloat(result!)).not.toBeCloseTo(50100, 0);
  });
});

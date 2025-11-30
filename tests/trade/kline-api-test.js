import { test, expect, request } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test.describe('Kline API Endpoint Tests', () => {
  const API_CONFIG = {
    baseUrl: 'https://base-sepolia-indexer.scalex.money',
    symbol: 'gsWETH%2FgsUSDC', // URL-encoded gsWETH/gsUSDC
    interval: '1h',
    limit: 100,
    // Use recent timestamps (last 30 days)
    get endTime() {
      return Date.now();
    },
    get startTime() {
      return this.endTime - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    }
  };

  test('should fetch pairs from API endpoint', async ({ request }) => {
    TestUtils.log('Testing /pairs endpoint...', 'info');
    
    const response = await request.get(`${API_CONFIG.baseUrl}/api/pairs`);
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    TestUtils.log(`Found ${data.length} pairs`, 'success');
    
    // Check if our test symbol exists
    const hasTestSymbol = data.some(pair => 
      pair.symbol === 'gsWETH/gsUSDC' || 
      pair.symbol === API_CONFIG.symbol.replace('%2F', '/')
    );
    
    if (hasTestSymbol) {
      TestUtils.log('Test symbol gsWETH/gsUSDC found in pairs list', 'success');
    } else {
      TestUtils.log('Test symbol gsWETH/gsUSDC NOT found in pairs list', 'warning');
      console.log('Available symbols:', data.slice(0, 10).map(p => p.symbol));
    }
    
    // Validate pair structure
    if (data.length > 0) {
      const firstPair = data[0];
      expect(firstPair).toHaveProperty('symbol');
      expect(firstPair).toHaveProperty('baseAsset');
      expect(firstPair).toHaveProperty('quoteAsset');
    }
  });

  test('should fetch kline data with basic parameters', async ({ request }) => {
    TestUtils.log('Testing /kline endpoint with basic parameters...', 'info');
    
    const params = new URLSearchParams({
      symbol: API_CONFIG.symbol,
      interval: API_CONFIG.interval,
      limit: API_CONFIG.limit.toString()
    });
    
    const url = `${API_CONFIG.baseUrl}/api/kline?${params}`;
    TestUtils.log(`Requesting: ${url}`, 'debug');
    
    const response = await request.get(url);
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    
    if (data.length > 0) {
      TestUtils.log(`Received ${data.length} candles`, 'success');
      
      const firstCandle = data[0];
      expect(Array.isArray(firstCandle)).toBe(true);
      expect(firstCandle.length).toBeGreaterThanOrEqual(6);
      
      TestUtils.log(`Sample candle: [${firstCandle.slice(0, 6).join(', ')}...]`, 'debug');
    } else {
      TestUtils.log('No candle data returned (empty array)', 'warning');
    }
  });

  test('should fetch kline data with time range', async ({ request }) => {
    TestUtils.log('Testing /kline endpoint with time range...', 'info');
    
    const params = new URLSearchParams({
      symbol: API_CONFIG.symbol,
      interval: API_CONFIG.interval,
      startTime: API_CONFIG.startTime.toString(),
      endTime: API_CONFIG.endTime.toString(),
      limit: API_CONFIG.limit.toString()
    });
    
    const url = `${API_CONFIG.baseUrl}/api/kline?${params}`;
    const response = await request.get(url);
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    TestUtils.log(`Time range query returned ${data.length} candles`, 'success');
  });

  test('should handle different intervals', async ({ request }) => {
    TestUtils.log('Testing different intervals...', 'info');
    
    const intervals = ['1m', '5m', '30m', '1h', '1d'];
    
    for (const interval of intervals) {
      const params = new URLSearchParams({
        symbol: API_CONFIG.symbol,
        interval: interval,
        limit: '50'
      });
      
      const url = `${API_CONFIG.baseUrl}/api/kline?${params}`;
      const response = await request.get(url);
      
      expect(response.ok()).toBe(true);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      TestUtils.log(`Interval ${interval}: ${data.length} candles`, 'debug');
    }
  });

  test('should handle missing symbol parameter', async ({ request }) => {
    TestUtils.log('Testing missing symbol parameter...', 'info');
    
    const params = new URLSearchParams({
      interval: '1h'
    });
    
    const url = `${API_CONFIG.baseUrl}/api/kline?${params}`;
    const response = await request.get(url);
    
    expect(response.ok()).toBe(false);
    const data = await response.json();
    
    expect(data).toHaveProperty('error');
    TestUtils.log('Error handling works correctly for missing symbol', 'success');
  });

  test('should handle invalid symbol', async ({ request }) => {
    TestUtils.log('Testing invalid symbol...', 'info');
    
    const params = new URLSearchParams({
      symbol: 'INVALID%2FSYMBOL',
      interval: '1h'
    });
    
    const url = `${API_CONFIG.baseUrl}/api/kline?${params}`;
    const response = await request.get(url);
    
    // Should either return error or empty array
    if (response.ok()) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      TestUtils.log(`Invalid symbol returned ${data.length} candles`, 'debug');
    } else {
      const data = await response.json();
      expect(data).toHaveProperty('error');
      TestUtils.log('Invalid symbol correctly returned error', 'success');
    }
  });

  test('should validate kline data format', async ({ request }) => {
    TestUtils.log('Testing kline data format validation...', 'info');
    
    const params = new URLSearchParams({
      symbol: API_CONFIG.symbol,
      interval: '1h',
      limit: '10'
    });
    
    const url = `${API_CONFIG.baseUrl}/api/kline?${params}`;
    const response = await request.get(url);
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    
    if (data.length > 0) {
      const candle = data[0];
      
      // Validate candle structure
      expect(Array.isArray(candle)).toBe(true);
      expect(candle.length).toBeGreaterThanOrEqual(6);
      
      // Validate data types (timestamps should be numbers)
      expect(typeof candle[0]).toBe('number'); // openTime
      expect(typeof candle[6]).toBe('number'); // closeTime (if present)
      
      // Prices should be strings or numbers
      expect(['string', 'number']).toContain(typeof candle[1]); // open
      expect(['string', 'number']).toContain(typeof candle[2]); // high
      expect(['string', 'number']).toContain(typeof candle[3]); // low
      expect(['string', 'number']).toContain(typeof candle[4]); // close
      
      TestUtils.log('Kline data format validation passed', 'success');
    } else {
      TestUtils.log('No data to validate', 'warning');
    }
  });

  test('should test symbol encoding scenarios', async ({ request }) => {
    TestUtils.log('Testing different symbol encoding scenarios...', 'info');
    
    const symbolVariations = [
      'gsWETH%2FgsUSDC',  // URL encoded (correct)
      'gsWETH/gsUSDC',     // Not URL encoded
      'gsWETHgsUSDC'       // No separator (incorrect)
    ];
    
    for (const symbol of symbolVariations) {
      TestUtils.log(`Testing symbol: ${symbol}`, 'debug');
      
      const params = new URLSearchParams({
        symbol: symbol,
        interval: '1h',
        limit: '10'
      });
      
      const url = `${API_CONFIG.baseUrl}/api/kline?${params}`;
      const response = await request.get(url);
      
      if (response.ok()) {
        const data = await response.json();
        TestUtils.log(`Symbol "${symbol}": ${Array.isArray(data) ? data.length : 'error'} candles`, 'debug');
      } else {
        const data = await response.json();
        TestUtils.log(`Symbol "${symbol}": Error - ${JSON.stringify(data)}`, 'debug');
      }
    }
  });

  test('should test API response performance', async ({ request }) => {
    TestUtils.log('Testing API response performance...', 'info');
    
    const params = new URLSearchParams({
      symbol: API_CONFIG.symbol,
      interval: '1h',
      limit: '1000'
    });
    
    const url = `${API_CONFIG.baseUrl}/api/kline?${params}`;
    const startTime = Date.now();
    
    const response = await request.get(url);
    const duration = Date.now() - startTime;
    
    expect(response.ok()).toBe(true);
    const data = await response.json();
    
    TestUtils.log(`API responded in ${duration}ms with ${Array.isArray(data) ? data.length : 0} candles`, 'success');
    
    // Performance assertion (should respond within 5 seconds)
    expect(duration).toBeLessThan(5000);
  });
});
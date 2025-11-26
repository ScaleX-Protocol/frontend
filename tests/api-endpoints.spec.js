const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3001';
const TEST_ADDRESS = '0xc8E6F712902DCA8f50B10Dd7Eb3c89E5a2Ed9a2a';

// Available trading symbols for testing
const TRADING_SYMBOLS = [
  // 'gsWBTC/gsUSDC',
  'gsWETH/gsUSDC'
];

test.describe('ScaleX API Endpoints', () => {
  
  // Test kline endpoints for all available symbols
  TRADING_SYMBOLS.forEach(symbol => {
    test(`Kline endpoints return data for ${symbol}`, async ({ request }) => {
      // Test 1m interval
      const minuteKline = await request.get(`${BASE_URL}/indexer/kline?symbol=${symbol}&interval=1m&limit=10`);
      expect(minuteKline.ok()).toBeTruthy();
      const minuteData = await minuteKline.json();
      expect(Array.isArray(minuteData)).toBeTruthy();
      expect(minuteData.length).toBe(10);
      expect(minuteData[0]).toHaveProperty('open');
      expect(minuteData[0]).toHaveProperty('high');
      expect(minuteData[0]).toHaveProperty('low');
      expect(minuteData[0]).toHaveProperty('close');
      expect(minuteData[0]).toHaveProperty('volume');
      
      // Test 5m interval
      const fiveMinKline = await request.get(`${BASE_URL}/indexer/kline?symbol=${symbol}&interval=5m&limit=5`);
      expect(fiveMinKline.ok()).toBeTruthy();
      const fiveMinData = await fiveMinKline.json();
      expect(Array.isArray(fiveMinData)).toBeTruthy();
      expect(fiveMinData.length).toBe(5);
      
      // Test hourly interval
      const hourlyKline = await request.get(`${BASE_URL}/indexer/kline?symbol=${symbol}&interval=1h&limit=24`);
      expect(hourlyKline.ok()).toBeTruthy();
      const hourlyData = await hourlyKline.json();
      expect(Array.isArray(hourlyData)).toBeTruthy();
      expect(hourlyData.length).toBe(24);
    });
  });

  test('Orders endpoints return data for all orders', async ({ request }) => {
    // Test all orders for user
    const allOrders = await request.get(`${BASE_URL}/indexer/allOrders?address=${TEST_ADDRESS}&limit=20`);
    expect(allOrders.ok()).toBeTruthy();
    const ordersData = await allOrders.json();
    expect(Array.isArray(ordersData)).toBeTruthy();
    expect(ordersData.length).toBeLessThanOrEqual(20);
    
    if (ordersData.length > 0) {
      expect(ordersData[0]).toHaveProperty('orderId');
      expect(ordersData[0]).toHaveProperty('symbol');
      expect(ordersData[0]).toHaveProperty('price');
      expect(ordersData[0]).toHaveProperty('side');
      expect(ordersData[0]).toHaveProperty('status');
    }
  });

  // Test symbol-specific orders for each trading pair
  TRADING_SYMBOLS.forEach(symbol => {
    test(`Orders endpoints return data for ${symbol}`, async ({ request }) => {
      const symbolOrders = await request.get(`${BASE_URL}/indexer/allOrders?address=${TEST_ADDRESS}&symbol=${symbol}&limit=10`);
      expect(symbolOrders.ok()).toBeTruthy();
      const symbolOrdersData = await symbolOrders.json();
      expect(Array.isArray(symbolOrdersData)).toBeTruthy();
      
      // Verify all orders are for the correct symbol
      symbolOrdersData.forEach(order => {
        expect(order.symbol).toBe(symbol);
      });
    });
  });

  // Test trades endpoints for all available symbols
  TRADING_SYMBOLS.forEach(symbol => {
    test(`Trades endpoints return data for ${symbol}`, async ({ request }) => {
      // Test market trades
      const marketTrades = await request.get(`${BASE_URL}/indexer/trades?symbol=${symbol}&limit=15`);
      expect(marketTrades.ok()).toBeTruthy();
      const tradesData = await marketTrades.json();
      expect(Array.isArray(tradesData)).toBeTruthy();
      expect(tradesData.length).toBeLessThanOrEqual(15);
      
      if (tradesData.length > 0) {
        expect(tradesData[0]).toHaveProperty('id');
        expect(tradesData[0]).toHaveProperty('price');
        expect(tradesData[0]).toHaveProperty('qty');
        expect(tradesData[0]).toHaveProperty('time');
        expect(tradesData[0]).toHaveProperty('isBuyerMaker');
      }
      
      // Test user-specific trades
      const userTrades = await request.get(`${BASE_URL}/indexer/trades?symbol=${symbol}&user=${TEST_ADDRESS}&limit=10`);
      expect(userTrades.ok()).toBeTruthy();
      const userTradesData = await userTrades.json();
      expect(Array.isArray(userTradesData)).toBeTruthy();
      
      // Test different ordering
      const ascTrades = await request.get(`${BASE_URL}/indexer/trades?symbol=${symbol}&orderBy=asc&limit=5`);
      expect(ascTrades.ok()).toBeTruthy();
      const ascTradesData = await ascTrades.json();
      expect(Array.isArray(ascTradesData)).toBeTruthy();
      
      const descTrades = await request.get(`${BASE_URL}/indexer/trades?symbol=${symbol}&orderBy=desc&limit=5`);
      expect(descTrades.ok()).toBeTruthy();
      const descTradesData = await descTrades.json();
      expect(Array.isArray(descTradesData)).toBeTruthy();
    });
  });

  // Test market depth for each symbol
  TRADING_SYMBOLS.forEach(symbol => {
    test(`Market depth endpoint for ${symbol}`, async ({ request }) => {
      const depth = await request.get(`${BASE_URL}/indexer/depth?symbol=${symbol}&limit=20`);
      // Note: This might not exist yet, so we'll check if it's implemented
      if (depth.status() !== 404) {
        expect(depth.ok()).toBeTruthy();
        const depthData = await depth.json();
        expect(depthData).toBeDefined();
      }
    });
  });

  test('General market endpoints', async ({ request }) => {
    // Test markets endpoint
    const markets = await request.get(`${BASE_URL}/indexer/markets`);
    if (markets.status() !== 404) {
      expect(markets.ok()).toBeTruthy();
      const marketsData = await markets.json();
      expect(marketsData).toBeDefined();
      expect(Array.isArray(marketsData)).toBeTruthy();
    }
    
    // Test pairs endpoint
    const pairs = await request.get(`${BASE_URL}/indexer/pairs`);
    if (pairs.status() !== 404) {
      expect(pairs.ok()).toBeTruthy();
      const pairsData = await pairs.json();
      expect(pairsData).toBeDefined();
    }
    
    // Test account endpoint
    const account = await request.get(`${BASE_URL}/indexer/account?address=${TEST_ADDRESS}`);
    if (account.status() !== 404) {
      expect(account.ok()).toBeTruthy();
      const accountData = await account.json();
      expect(accountData).toBeDefined();
    }
  });

  test('API endpoints handle errors properly', async ({ request }) => {
    // Test kline without required symbol
    const noSymbolKline = await request.get(`${BASE_URL}/indexer/kline?interval=1m&limit=10`);
    expect(noSymbolKline.status()).toBe(400);
    
    // Test orders without required address
    const noAddressOrders = await request.get(`${BASE_URL}/indexer/allOrders?limit=10`);
    expect(noAddressOrders.status()).toBe(400);
    
    // Test with invalid parameters
    const invalidInterval = await request.get(`${BASE_URL}/indexer/kline?symbol=gsWBTC/gsUSDC&interval=invalid&limit=10`);
    expect(invalidInterval.ok()).toBeTruthy(); // Should still work with fallback
    
    const invalidLimit = await request.get(`${BASE_URL}/indexer/kline?symbol=gsWBTC/gsUSDC&interval=1m&limit=abc`);
    expect(invalidLimit.ok()).toBeTruthy(); // Should work with default limit
  });

  // Test data consistency and format validation for all symbols
  TRADING_SYMBOLS.forEach(symbol => {
    test(`Data consistency and format validation for ${symbol}`, async ({ request }) => {
      // Test kline data format
      const klineResponse = await request.get(`${BASE_URL}/indexer/kline?symbol=${symbol}&interval=1m&limit=5`);
      const klineData = await klineResponse.json();
      
      klineData.forEach(candle => {
        expect(typeof candle.openTime).toBe('number');
        expect(typeof candle.closeTime).toBe('number');
        expect(typeof candle.open).toBe('string');
        expect(typeof candle.high).toBe('string');
        expect(typeof candle.low).toBe('string');
        expect(typeof candle.close).toBe('string');
        expect(typeof candle.volume).toBe('string');
        expect(typeof candle.numberOfTrades).toBe('number');
        
        // Validate price relationships
        const openPrice = parseFloat(candle.open);
        const highPrice = parseFloat(candle.high);
        const lowPrice = parseFloat(candle.low);
        const closePrice = parseFloat(candle.close);
        
        expect(highPrice).toBeGreaterThanOrEqual(Math.max(openPrice, closePrice));
        expect(lowPrice).toBeLessThanOrEqual(Math.min(openPrice, closePrice));
      });
      
      // Test trades data format for this symbol
      const tradesResponse = await request.get(`${BASE_URL}/indexer/trades?symbol=${symbol}&limit=3`);
      const tradesData = await tradesResponse.json();
      
      tradesData.forEach(trade => {
        expect(typeof trade.id).toBe('string');
        expect(typeof trade.price).toBe('string');
        expect(typeof trade.qty).toBe('string');
        expect(typeof trade.time).toBe('number');
        expect(typeof trade.isBuyerMaker).toBe('boolean');
        expect(typeof trade.isBestMatch).toBe('boolean');
      });
    });
  });

  test('Orders data format validation', async ({ request }) => {
    // Test orders data format (not symbol-specific)
    const ordersResponse = await request.get(`${BASE_URL}/indexer/allOrders?address=${TEST_ADDRESS}&limit=3`);
    const ordersData = await ordersResponse.json();
    
    ordersData.forEach(order => {
      expect(typeof order.orderId).toBe('string');
      expect(typeof order.symbol).toBe('string');
      expect(typeof order.price).toBe('string');
      expect(typeof order.origQty).toBe('string');
      expect(typeof order.side).toBe('string');
      expect(['BUY', 'SELL']).toContain(order.side);
      expect(['NEW', 'FILLED', 'PARTIALLY_FILLED', 'CANCELED']).toContain(order.status);
    });
  });

  test('Performance and response times', async ({ request }) => {
    const startTime = Date.now();
    
    // Test concurrent requests for both symbols
    const promises = [
      // Kline data for both symbols
      request.get(`${BASE_URL}/indexer/kline?symbol=gsWBTC/gsUSDC&interval=1m&limit=100`),
      request.get(`${BASE_URL}/indexer/kline?symbol=gsWETH/gsUSDC&interval=1m&limit=100`),
      // Orders data
      request.get(`${BASE_URL}/indexer/allOrders?address=${TEST_ADDRESS}&limit=50`),
      // Trades data for both symbols
      request.get(`${BASE_URL}/indexer/trades?symbol=gsWBTC/gsUSDC&limit=100`),
      request.get(`${BASE_URL}/indexer/trades?symbol=gsWETH/gsUSDC&limit=100`)
    ];
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // All requests should complete successfully
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
    
    // Should complete in reasonable time (less than 5 seconds)
    expect(totalTime).toBeLessThan(5000);
    
    console.log(`All ${promises.length} concurrent requests completed in ${totalTime}ms`);
  });

  // Test comprehensive symbol coverage
  test('All symbols are testable', async ({ request }) => {
    const results = await Promise.all(
      TRADING_SYMBOLS.map(async symbol => {
        const klineTest = await request.get(`${BASE_URL}/indexer/kline?symbol=${symbol}&interval=1m&limit=1`);
        const tradesTest = await request.get(`${BASE_URL}/indexer/trades?symbol=${symbol}&limit=1`);
        
        return {
          symbol,
          klineWorks: klineTest.ok(),
          tradesWorks: tradesTest.ok()
        };
      })
    );
    
    results.forEach(result => {
      expect(result.klineWorks).toBeTruthy();
      expect(result.tradesWorks).toBeTruthy();
      console.log(`✓ ${result.symbol}: Kline ${result.klineWorks}, Trades ${result.tradesWorks}`);
    });
    
    console.log(`All ${TRADING_SYMBOLS.length} symbols are fully functional`);
  });
});
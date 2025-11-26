const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const TEST_ADDRESS = '0xc8E6F712902DCA8f50B10Dd7Eb3c89E5a2Ed9a2a';

// Available trading symbols for testing
const TRADING_SYMBOLS = [
  'gsWBTC/gsUSDC',
  'gsWETH/gsUSDC'
];

// Store all API calls and responses
const apiCalls = [];

// Helper function to make request and capture data
async function captureApiCall(request, url, description, payload = null) {
  const startTime = Date.now();
  
  try {
    let response;
    if (payload) {
      response = await request.post(url, { data: payload });
    } else {
      response = await request.get(url);
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }
    
    const apiCall = {
      description,
      timestamp: new Date().toISOString(),
      request: {
        method: payload ? 'POST' : 'GET',
        url,
        payload: payload || null
      },
      response: {
        status: response.status(),
        statusText: response.statusText(),
        headers: Object.fromEntries(Object.entries(response.headers())),
        data: responseData,
        dataType: Array.isArray(responseData) ? 'array' : typeof responseData,
        dataLength: Array.isArray(responseData) ? responseData.length : 
                   (typeof responseData === 'string' ? responseData.length : 'N/A')
      },
      performance: {
        responseTimeMs: responseTime,
        success: response.ok()
      }
    };
    
    apiCalls.push(apiCall);
    return response;
    
  } catch (error) {
    const errorCall = {
      description,
      timestamp: new Date().toISOString(),
      request: {
        method: payload ? 'POST' : 'GET',
        url,
        payload: payload || null
      },
      response: null,
      error: {
        message: error.message,
        stack: error.stack
      },
      performance: {
        responseTimeMs: Date.now() - startTime,
        success: false
      }
    };
    
    apiCalls.push(errorCall);
    throw error;
  }
}

test.describe('ScaleX API Export - Generate Complete API Documentation', () => {
  
  test.beforeAll(async () => {
    // Clear previous results
    apiCalls.length = 0;
  });
  
  test.afterAll(async () => {
    // Generate comprehensive JSON export
    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        testAddress: TEST_ADDRESS,
        tradingSymbols: TRADING_SYMBOLS,
        totalApiCalls: apiCalls.length,
        successfulCalls: apiCalls.filter(call => call.performance?.success).length,
        failedCalls: apiCalls.filter(call => !call.performance?.success).length
      },
      summary: {
        endpoints: [...new Set(apiCalls.map(call => {
          try {
            const url = new URL(call.request.url);
            return url.pathname;
          } catch (e) {
            return call.request.url || 'unknown';
          }
        }))],
        methods: [...new Set(apiCalls.map(call => call.request.method))],
        averageResponseTime: Math.round(
          apiCalls.reduce((sum, call) => sum + (call.performance?.responseTimeMs || 0), 0) / apiCalls.length
        )
      },
      apiCalls: apiCalls
    };
    
    // Write to JSON file
    const outputPath = path.join(process.cwd(), 'api-export-complete.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    
    // Also create a simplified version for easier reading
    const simplifiedCalls = apiCalls.map(call => ({
      description: call.description,
      url: call.request.url,
      method: call.request.method,
      payload: call.request.payload,
      status: call.response?.status,
      dataLength: call.response?.dataLength,
      responseTime: call.performance?.responseTimeMs,
      success: call.performance?.success
    }));
    
    const simplifiedPath = path.join(process.cwd(), 'api-export-summary.json');
    fs.writeFileSync(simplifiedPath, JSON.stringify({
      metadata: exportData.metadata,
      summary: exportData.summary,
      apiCalls: simplifiedCalls
    }, null, 2));
    
    console.log(`\n📊 API Export Complete!`);
    console.log(`📁 Full export: ${outputPath}`);
    console.log(`📄 Summary: ${simplifiedPath}`);
    console.log(`📈 Total calls: ${apiCalls.length}`);
    console.log(`✅ Successful: ${exportData.metadata.successfulCalls}`);
    console.log(`❌ Failed: ${exportData.metadata.failedCalls}`);
  });

  // Test all kline endpoints for each symbol
  TRADING_SYMBOLS.forEach(symbol => {
    test(`Export Kline data for ${symbol}`, async ({ request }) => {
      const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];
      const limits = [5, 10, 50, 100, 500];
      
      for (const interval of intervals) {
        for (const limit of limits) {
          const url = `${BASE_URL}/indexer/kline?symbol=${symbol}&interval=${interval}&limit=${limit}`;
          const description = `Get ${symbol} kline data (${interval}, limit=${limit})`;
          
          const response = await captureApiCall(request, url, description);
          expect(response.ok()).toBeTruthy();
        }
      }
    });
  });

  // Test all order endpoints
  test('Export Orders data', async ({ request }) => {
    const limits = [10, 20, 50, 100, 200];
    
    // All orders for user
    for (const limit of limits) {
      const url = `${BASE_URL}/indexer/allOrders?address=${TEST_ADDRESS}&limit=${limit}`;
      const description = `Get all orders for user (limit=${limit})`;
      
      const response = await captureApiCall(request, url, description);
      expect(response.ok()).toBeTruthy();
    }
    
    // Symbol-specific orders
    for (const symbol of TRADING_SYMBOLS) {
      for (const limit of [10, 50]) {
        const url = `${BASE_URL}/indexer/allOrders?address=${TEST_ADDRESS}&symbol=${symbol}&limit=${limit}`;
        const description = `Get ${symbol} orders for user (limit=${limit})`;
        
        const response = await captureApiCall(request, url, description);
        expect(response.ok()).toBeTruthy();
      }
    }
  });

  // Test all trades endpoints
  TRADING_SYMBOLS.forEach(symbol => {
    test(`Export Trades data for ${symbol}`, async ({ request }) => {
      const limits = [10, 50, 100, 500];
      const orderByOptions = ['asc', 'desc'];
      
      // Market trades
      for (const limit of limits) {
        const url = `${BASE_URL}/indexer/trades?symbol=${symbol}&limit=${limit}`;
        const description = `Get ${symbol} market trades (limit=${limit})`;
        
        const response = await captureApiCall(request, url, description);
        expect(response.ok()).toBeTruthy();
      }
      
      // User trades
      for (const limit of [10, 50]) {
        const url = `${BASE_URL}/indexer/trades?symbol=${symbol}&user=${TEST_ADDRESS}&limit=${limit}`;
        const description = `Get ${symbol} user trades (limit=${limit})`;
        
        const response = await captureApiCall(request, url, description);
        expect(response.ok()).toBeTruthy();
      }
      
      // Ordered trades
      for (const orderBy of orderByOptions) {
        const url = `${BASE_URL}/indexer/trades?symbol=${symbol}&orderBy=${orderBy}&limit=20`;
        const description = `Get ${symbol} trades ordered ${orderBy}`;
        
        const response = await captureApiCall(request, url, description);
        expect(response.ok()).toBeTruthy();
      }
    });
  });

  // Test market data endpoints
  test('Export Market Data endpoints', async ({ request }) => {
    // Markets endpoint
    const marketsUrl = `${BASE_URL}/indexer/markets`;
    await captureApiCall(request, marketsUrl, 'Get all markets');
    
    // Pairs endpoint
    const pairsUrl = `${BASE_URL}/indexer/pairs`;
    try {
      await captureApiCall(request, pairsUrl, 'Get all trading pairs');
    } catch (e) {
      // Endpoint might not exist yet
    }
    
    // Account endpoint
    const accountUrl = `${BASE_URL}/indexer/account?address=${TEST_ADDRESS}`;
    try {
      await captureApiCall(request, accountUrl, 'Get account information');
    } catch (e) {
      // Endpoint might not exist yet
    }
    
    // Depth endpoints for each symbol
    for (const symbol of TRADING_SYMBOLS) {
      const depthUrl = `${BASE_URL}/indexer/depth?symbol=${symbol}&limit=20`;
      try {
        await captureApiCall(request, depthUrl, `Get ${symbol} market depth`);
      } catch (e) {
        // Endpoint might not exist yet
      }
    }
  });

  // Test error cases
  test('Export Error cases', async ({ request }) => {
    const errorCases = [
      {
        url: `${BASE_URL}/indexer/kline?interval=1m&limit=10`,
        description: 'Kline without symbol (should fail)'
      },
      {
        url: `${BASE_URL}/indexer/allOrders?limit=10`,
        description: 'Orders without address (should fail)'
      },
      {
        url: `${BASE_URL}/indexer/kline?symbol=INVALID&interval=1m&limit=10`,
        description: 'Kline with invalid symbol'
      },
      {
        url: `${BASE_URL}/indexer/nonexistent`,
        description: 'Non-existent endpoint (should 404)'
      }
    ];
    
    for (const errorCase of errorCases) {
      try {
        await captureApiCall(request, errorCase.url, errorCase.description);
      } catch (e) {
        // Expected to fail
      }
    }
  });

  // Test performance scenarios
  test('Export Performance scenarios', async ({ request }) => {
    // Large dataset requests
    const largeDataCases = [
      {
        url: `${BASE_URL}/indexer/kline?symbol=gsWETH/gsUSDC&interval=1m&limit=1000`,
        description: 'Large kline dataset (1000 candles)'
      },
      {
        url: `${BASE_URL}/indexer/allOrders?address=${TEST_ADDRESS}&limit=500`,
        description: 'Large orders dataset (500 orders)'
      },
      {
        url: `${BASE_URL}/indexer/trades?symbol=gsWETH/gsUSDC&limit=1000`,
        description: 'Large trades dataset (1000 trades)'
      }
    ];
    
    for (const testCase of largeDataCases) {
      const response = await captureApiCall(request, testCase.url, testCase.description);
      expect(response.ok()).toBeTruthy();
    }
    
    // Concurrent requests
    const concurrentUrls = [
      `${BASE_URL}/indexer/kline?symbol=gsWETH/gsUSDC&interval=1m&limit=100`,
      `${BASE_URL}/indexer/trades?symbol=gsWETH/gsUSDC&limit=100`,
      `${BASE_URL}/indexer/allOrders?address=${TEST_ADDRESS}&limit=100`,
      `${BASE_URL}/indexer/markets`
    ];
    
    const startTime = Date.now();
    const concurrentPromises = concurrentUrls.map((url, index) => 
      captureApiCall(request, url, `Concurrent request ${index + 1}`)
    );
    
    await Promise.all(concurrentPromises);
    const totalTime = Date.now() - startTime;
    
    // Add summary of concurrent performance
    apiCalls.push({
      description: 'Concurrent requests performance summary',
      timestamp: new Date().toISOString(),
      request: { method: 'SUMMARY', url: 'concurrent-test' },
      response: {
        data: {
          totalRequests: concurrentUrls.length,
          totalTimeMs: totalTime,
          averageTimePerRequest: Math.round(totalTime / concurrentUrls.length)
        }
      },
      performance: { responseTimeMs: totalTime, success: true }
    });
  });
});
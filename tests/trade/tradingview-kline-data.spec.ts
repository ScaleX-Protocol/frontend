import { test, expect, Page } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test.describe('TradingView Kline Data Loading', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      } else if (msg.text().includes('kline') || msg.text().includes('TradingView')) {
        console.log(`📊 TradingView Log: ${msg.text()}`);
      }
    });

    // Monitor network requests for API calls
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/kline') || url.includes('/pairs')) {
        TestUtils.log(`🌐 API Request: ${request.method()} ${url}`, 'debug');
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/kline') || url.includes('/pairs')) {
        TestUtils.log(`📥 API Response: ${response.status()} ${url}`, 
          response.ok() ? 'success' : 'error');
      }
    });
  });

  test.afterEach(async () => {
    await page?.close();
  });

  test('should load TradingView chart with kline data', async () => {
    test.setTimeout(90000);

    TestUtils.log('Testing TradingView chart data loading...', 'info');
    
    let klineDataReceived = false;
    let klineResponse: any = null;

    // Monitor API calls to capture kline data
    await page.route('**/kline*', async (route) => {
      const response = await route.fetch();
      klineResponse = await response.json();
      klineDataReceived = Array.isArray(klineResponse) && klineResponse.length > 0;
      
      if (klineDataReceived) {
        TestUtils.log(`Kline API returned ${klineResponse.length} candles`, 'success');
      } else {
        TestUtils.log('Kline API returned empty or invalid data', 'warning');
      }
      
      route.fulfill({ response });
    });
    
    // Navigate to trade page
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    // Wait for TradingView container to be present
    TestUtils.log('Waiting for TradingView container...', 'debug');
    const chartContainer = page.locator('#tv_chart_container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });

    // Wait for TradingView script to load
    TestUtils.log('Waiting for TradingView script...', 'debug');
    await page.waitForFunction(
      () => typeof window.TradingView !== 'undefined',
      { timeout: 30000 }
    );

    // Wait for chart widget initialization
    TestUtils.log('Waiting for chart widget initialization...', 'debug');
    await page.waitForFunction(
      () => {
        const container = document.getElementById('tv_chart_container');
        return container && container.children.length > 0;
      },
      { timeout: 30000 }
    );

    // Wait for kline data to be fetched
    TestUtils.log('Waiting for kline data...', 'debug');
    await page.waitForTimeout(10000); // Give time for API calls

    // Check for error states
    const errorOverlay = page.locator('text=/Failed to load|Error|error/i').first();
    const isErrorVisible = await errorOverlay.isVisible();
    if (isErrorVisible) {
      const errorText = await errorOverlay.textContent();
      TestUtils.log(`Chart error detected: ${errorText}`, 'error');
    }

    // Verify chart canvas is rendered
    TestUtils.log('Checking for chart canvas...', 'debug');
    const chartCanvas = page.locator('#tv_chart_container canvas');
    await expect(chartCanvas).toBeVisible({ timeout: 15000 });

    // Validate that kline data was received
    expect(klineDataReceived).toBe(true);
    
    // Validate kline data structure if received
    if (klineResponse && klineResponse.length > 0) {
      const firstCandle = klineResponse[0];
      expect(Array.isArray(firstCandle)).toBe(true);
      expect(firstCandle.length).toBeGreaterThanOrEqual(6);
      TestUtils.log('Kline data structure is valid', 'success');
    }

    // Wait for chart to potentially render data
    await page.waitForTimeout(5000);

    // Check if chart shows "No data" or loading indicators
    const noDataText = page.locator('text=/No data|no data|No Data/i').first();
    const isNoDataVisible = await noDataText.isVisible();
    
    if (isNoDataVisible) {
      TestUtils.log('Chart shows "No data" despite API returning data', 'warning');
    } else {
      TestUtils.log('Chart appears to have data rendered', 'success');
    }

    // Try to detect TradingView chart elements that indicate data is loaded
    const chartBars = await page.evaluate(() => {
      // Look for TradingView chart elements
      const canvases = document.querySelectorAll('#tv_chart_container canvas');
      let hasDrawnContent = false;
      
      canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Check if canvas has non-transparent pixels (indicating drawn content)
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 0) { // Alpha channel > 0
              hasDrawnContent = true;
              break;
            }
          }
        }
      });
      
      return {
        canvasCount: canvases.length,
        hasDrawnContent,
        containerHTML: document.getElementById('tv_chart_container')?.innerHTML?.length || 0
      };
    });

    TestUtils.log(`Chart analysis: ${chartBars.canvasCount} canvases, drawn content: ${chartBars.hasDrawnContent}, HTML size: ${chartBars.containerHTML}`, 'debug');

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'tests/screenshots/tradingview-chart-loaded.png', 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 600 }
    });

    // Advanced validation: Check for TradingView specific elements that indicate data rendering
    const chartDataElements = await page.evaluate(() => {
      // Look for TradingView specific elements
      const tvElements = {
        priceScale: document.querySelectorAll('[data-name="price-axis"]').length,
        timeScale: document.querySelectorAll('[data-name="time-axis"]').length,
        chartPane: document.querySelectorAll('[data-name="pane"]').length,
        series: document.querySelectorAll('[data-name="series"]').length,
      };
      
      return tvElements;
    });

    TestUtils.log(`TradingView elements found: ${JSON.stringify(chartDataElements)}`, 'debug');

    // Final validation
    expect(chartBars.canvasCount).toBeGreaterThan(0);
    expect(chartBars.containerHTML).toBeGreaterThan(1000); // Should have substantial HTML content
    
    if (chartBars.hasDrawnContent) {
      TestUtils.log('✅ TradingView chart successfully loaded with visual data', 'success');
    } else {
      TestUtils.log('⚠️  TradingView chart loaded but no visual data detected', 'warning');
    }

    TestUtils.log('TradingView chart loading test completed', 'success');
  });

  test('should handle kline API errors gracefully', async () => {
    TestUtils.log('Testing API error handling...', 'info');

    // Intercept kline API calls and make them fail
    await page.route('**/kline*', (route) => {
      TestUtils.log('Intercepting kline API call and returning error', 'debug');
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    // Wait for TradingView container
    const chartContainer = page.locator('#tv_chart_container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });

    // Should show error state or continue loading without crashing
    await page.waitForTimeout(10000);

    // Check that page doesn't crash
    const title = await page.title();
    expect(title).toBeTruthy();

    TestUtils.log('API error handled without page crash', 'success');
  });

  test('should handle empty kline data response', async () => {
    TestUtils.log('Testing empty data handling...', 'info');

    // Intercept kline API calls and return empty array
    await page.route('**/kline*', (route) => {
      TestUtils.log('Intercepting kline API call and returning empty array', 'debug');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    // Wait for TradingView container
    const chartContainer = page.locator('#tv_chart_container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });

    // Chart should handle empty data gracefully
    await page.waitForTimeout(10000);

    // Take screenshot to see how empty data is handled
    await page.screenshot({ 
      path: 'tests/screenshots/tradingview-empty-data.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 600 }
    });

    TestUtils.log('Empty data handled gracefully', 'success');
  });

  test('should verify kline data format and API call', async () => {
    TestUtils.log('Testing kline data format...', 'info');

    let apiCallMade = false;
    let responseData: any = null;

    // Monitor the actual kline API call
    await page.route('**/kline*', async (route) => {
      const url = route.request().url();
      TestUtils.log(`Kline API called: ${url}`, 'debug');
      
      // Extract parameters from URL
      const urlObj = new URL(url);
      const symbol = urlObj.searchParams.get('symbol');
      const interval = urlObj.searchParams.get('interval');
      const startTime = urlObj.searchParams.get('startTime');
      const endTime = urlObj.searchParams.get('endTime');
      
      TestUtils.log(`Parameters: symbol=${symbol}, interval=${interval}, startTime=${startTime}, endTime=${endTime}`, 'debug');
      
      // Verify symbol is properly encoded
      expect(symbol).toBeTruthy();
      expect(symbol).toContain('gs'); // Should contain token symbols
      
      apiCallMade = true;
      
      // Continue with original request and capture response
      const response = await route.fetch();
      const responseText = await response.text();
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        TestUtils.log('Failed to parse response as JSON', 'error');
      }
      
      route.fulfill({ response });
    });

    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    // Wait for API call to be made
    await page.waitForTimeout(15000);

    // Verify API call was made
    expect(apiCallMade).toBe(true);
    TestUtils.log('Kline API call verified', 'success');

    // If we got data, verify its format
    if (responseData && Array.isArray(responseData) && responseData.length > 0) {
      const firstCandle = responseData[0];
      TestUtils.log(`Sample kline data: ${JSON.stringify(firstCandle).substring(0, 200)}...`, 'debug');
      
      // Verify kline data structure (should be array of arrays)
      expect(Array.isArray(firstCandle)).toBe(true);
      expect(firstCandle.length).toBeGreaterThanOrEqual(6); // Should have OHLCV + timestamp
      
      TestUtils.log('Kline data format is valid', 'success');
    } else {
      TestUtils.log('No kline data received or empty response', 'warning');
    }
  });

  test('should test symbol normalization', async () => {
    TestUtils.log('Testing symbol normalization...', 'info');

    let symbolUsed = '';

    // Capture the symbol being used in API calls
    await page.route('**/kline*', (route) => {
      const url = route.request().url();
      const urlObj = new URL(url);
      symbolUsed = urlObj.searchParams.get('symbol') || '';
      
      TestUtils.log(`Symbol used in API call: ${symbolUsed}`, 'debug');
      
      // Continue with request
      route.continue();
    });

    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    // Wait for API call
    await page.waitForTimeout(10000);

    // Verify symbol is properly URL encoded
    if (symbolUsed) {
      // Should be URL encoded format like gsWETH%2FgsUSDC
      expect(symbolUsed).toMatch(/gs\w+%2Fgs\w+/);
      TestUtils.log(`Symbol properly encoded: ${symbolUsed}`, 'success');
    } else {
      TestUtils.log('No symbol captured from API call', 'error');
    }
  });

  test('should validate TradingView chart displays kline data correctly', async () => {
    test.setTimeout(120000);

    TestUtils.log('Comprehensive TradingView chart validation...', 'info');
    
    let klineApiData: any = null;
    let apiCallParams: any = {};
    let rawApiUrl: string = '';

    // Monitor and capture kline API calls and responses
    await page.route('**/kline*', async (route) => {
      const url = route.request().url();
      rawApiUrl = url;
      const urlObj = new URL(url);
      
      apiCallParams = {
        symbol: urlObj.searchParams.get('symbol'),
        interval: urlObj.searchParams.get('interval'),
        startTime: urlObj.searchParams.get('startTime'),
        endTime: urlObj.searchParams.get('endTime'),
        limit: urlObj.searchParams.get('limit')
      };
      
      TestUtils.log(`Kline API called with params: ${JSON.stringify(apiCallParams)}`, 'debug');
      
      const response = await route.fetch();
      klineApiData = await response.json();
      
      TestUtils.log(`API response: ${Array.isArray(klineApiData) ? klineApiData.length : 0} candles`, 'debug');
      
      route.fulfill({ response });
    });
    
    // Navigate to trade page
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    // Wait for complete chart initialization
    TestUtils.log('Waiting for complete chart initialization...', 'debug');
    
    // Step 1: Container exists
    const chartContainer = page.locator('#tv_chart_container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });
    
    // Step 2: TradingView library loaded
    await page.waitForFunction(
      () => typeof window.TradingView !== 'undefined',
      { timeout: 30000 }
    );
    
    // Step 3: Chart widget created
    await page.waitForFunction(
      () => {
        const container = document.getElementById('tv_chart_container');
        return container && container.children.length > 0;
      },
      { timeout: 30000 }
    );

    // Step 4: Wait for data fetching and rendering
    TestUtils.log('Waiting for data fetching and chart rendering...', 'debug');
    await page.waitForTimeout(15000);

    // Validate API call was made with correct parameters
    expect(apiCallParams.symbol).toBeTruthy();
    expect(apiCallParams.symbol).toMatch(/gs\w+\/gs\w+/); // Should be trading pair format
    expect(apiCallParams.interval).toBe('1h');
    expect(parseInt(apiCallParams.startTime || '0')).toBeGreaterThan(1000000000000); // Should be realistic timestamp
    expect(parseInt(apiCallParams.endTime || '0')).toBeGreaterThan(parseInt(apiCallParams.startTime || '0'));
    
    TestUtils.log('✅ API parameters validation passed', 'success');

    // Validate API response data
    expect(Array.isArray(klineApiData)).toBe(true);
    expect(klineApiData.length).toBeGreaterThan(0);
    
    if (klineApiData.length > 0) {
      const firstCandle = klineApiData[0];
      expect(Array.isArray(firstCandle)).toBe(true);
      expect(firstCandle.length).toBeGreaterThanOrEqual(6);
      
      // Validate candle data structure: [timestamp, open, high, low, close, volume, ...]
      expect(typeof firstCandle[0]).toBe('number'); // timestamp
      expect(firstCandle[0]).toBeGreaterThan(1000000000000); // realistic timestamp
      
      TestUtils.log(`✅ Kline data validation passed - ${klineApiData.length} candles`, 'success');
    }

    // Visual validation of chart rendering
    const chartAnalysis = await page.evaluate(() => {
      const container = document.getElementById('tv_chart_container');
      if (!container) return null;
      
      const canvases = container.querySelectorAll('canvas');
      let totalPixels = 0;
      let nonTransparentPixels = 0;
      
      canvases.forEach(canvas => {
        if (canvas.width > 0 && canvas.height > 0) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            
            for (let i = 0; i < pixels.length; i += 4) {
              totalPixels++;
              // Check alpha channel (transparency)
              if (pixels[i + 3] > 0) {
                nonTransparentPixels++;
              }
            }
          }
        }
      });
      
      return {
        canvasCount: canvases.length,
        totalPixels,
        nonTransparentPixels,
        pixelRatio: totalPixels > 0 ? nonTransparentPixels / totalPixels : 0,
        containerSize: {
          width: container.clientWidth,
          height: container.clientHeight
        },
        hasIframes: container.querySelectorAll('iframe').length > 0,
        hasTable: container.querySelectorAll('table').length > 0
      };
    });

    TestUtils.log(`Chart analysis: ${JSON.stringify(chartAnalysis, null, 2)}`, 'debug');

    // Validate chart rendering
    expect(chartAnalysis?.canvasCount).toBeGreaterThan(0);
    expect(chartAnalysis?.containerSize.width).toBeGreaterThan(100);
    expect(chartAnalysis?.containerSize.height).toBeGreaterThan(100);
    
    if (chartAnalysis && chartAnalysis.nonTransparentPixels > 1000) {
      TestUtils.log('✅ Chart has significant visual content rendered', 'success');
    } else {
      TestUtils.log('⚠️  Chart may not have visible data content', 'warning');
    }

    // Check for TradingView-specific error messages
    const commonErrors = [
      'No data',
      'Loading',
      'Failed to load',
      'Error',
      'Invalid symbol',
      'Connection error'
    ];

    let errorFound = false;
    for (const error of commonErrors) {
      const errorElement = page.locator(`text=${error}`).first();
      if (await errorElement.isVisible()) {
        TestUtils.log(`⚠️  Found error message: "${error}"`, 'warning');
        errorFound = true;
      }
    }

    if (!errorFound) {
      TestUtils.log('✅ No error messages detected', 'success');
    }

    // Advanced TradingView widget state checking
    const tvWidgetState = await page.evaluate(() => {
      // Try to access TradingView widget internal state
      const container = document.getElementById('tv_chart_container');
      if (!container) return null;
      
      // Look for TradingView specific DOM structure
      const tvElements = {
        layoutTable: container.querySelector('table') ? 1 : 0,
        priceScale: container.querySelectorAll('[class*="price"]').length,
        timeScale: container.querySelectorAll('[class*="time"]').length,
        chartAreas: container.querySelectorAll('[class*="chart"]').length,
        seriesElements: container.querySelectorAll('[class*="series"]').length
      };
      
      return tvElements;
    });

    TestUtils.log(`TradingView widget elements: ${JSON.stringify(tvWidgetState)}`, 'debug');

    // Take comprehensive screenshots
    await page.screenshot({ 
      path: 'tests/screenshots/tradingview-full-validation.png', 
      fullPage: true
    });
    
    await page.screenshot({ 
      path: 'tests/screenshots/tradingview-chart-area.png', 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1400, height: 800 }
    });

    // Final comprehensive validation
    const validationResults = {
      apiCalled: !!apiCallParams.symbol,
      dataReceived: Array.isArray(klineApiData) && klineApiData.length > 0,
      chartRendered: (chartAnalysis?.canvasCount || 0) > 0,
      hasVisualContent: (chartAnalysis?.nonTransparentPixels || 0) > 1000,
      noErrors: !errorFound,
      symbolEncoded: rawApiUrl.includes('%2F'),
      realisticTimestamps: parseInt(apiCallParams.startTime || '0') > 1000000000000
    };

    TestUtils.log(`Final validation results: ${JSON.stringify(validationResults, null, 2)}`, 'info');

    // Assert all key validations pass
    expect(validationResults.apiCalled).toBe(true);
    expect(validationResults.dataReceived).toBe(true);
    expect(validationResults.chartRendered).toBe(true);
    expect(validationResults.symbolEncoded).toBe(true);
    expect(validationResults.realisticTimestamps).toBe(true);

    if (validationResults.hasVisualContent && validationResults.noErrors) {
      TestUtils.log('🎉 TradingView chart successfully displays kline data!', 'success');
    } else if (validationResults.hasVisualContent) {
      TestUtils.log('✅ Chart displays data but with some warnings', 'success');
    } else {
      TestUtils.log('⚠️  Chart loads but visual data display needs verification', 'warning');
    }
  });
});
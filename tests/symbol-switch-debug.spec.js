const { test, expect } = require('@playwright/test');

test.describe('Symbol Switch Debug', () => {
  
  test('Monitor API calls when switching symbols', async ({ page }) => {
    const apiCalls = [];
    
    // Listen for all requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/indexer/')) {
        apiCalls.push({
          url,
          timestamp: Date.now(),
          type: url.includes('kline') ? 'kline' : 
                url.includes('trades') ? 'trades' :
                url.includes('allOrders') ? 'orders' : 'other'
        });
      }
    });
    
    // Go to trade page
    await page.goto('http://localhost:3001/trade');
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000); // Wait for initial load
    
    console.log('Initial API calls:', apiCalls.length);
    apiCalls.forEach(call => {
      console.log(`  ${call.type}: ${call.url}`);
    });
    
    // Clear the array to monitor only the switch
    const initialCallCount = apiCalls.length;
    apiCalls.length = 0;
    
    // Find and click the symbol selector
    const selectorButton = page.getByTestId('symbol-selector-button');
    await expect(selectorButton).toBeVisible();
    
    const initialSymbol = await selectorButton.textContent();
    console.log('Initial symbol:', initialSymbol);
    
    // Open dropdown and switch symbol
    await selectorButton.click();
    
    // Wait for dropdown to be visible
    await page.waitForTimeout(500);
    
    // Try to click on a different symbol
    const symbolOptions = await page.getByTestId(/^symbol-option-/).all();
    console.log('Available symbol options:', symbolOptions.length);
    
    if (symbolOptions.length > 1) {
      // Click on the second symbol option
      await symbolOptions[1].click();
      console.log('Clicked on symbol option');
      
      // Wait for potential API calls
      await page.waitForTimeout(3000);
      
      const newSymbol = await selectorButton.textContent();
      console.log('New symbol:', newSymbol);
      console.log('Symbol changed:', initialSymbol !== newSymbol);
      
      console.log('API calls after switch:', apiCalls.length);
      apiCalls.forEach(call => {
        console.log(`  ${call.type}: ${call.url}`);
      });
      
      // Group calls by type
      const callsByType = apiCalls.reduce((acc, call) => {
        acc[call.type] = (acc[call.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Calls by type after switch:', callsByType);
      
      // Check if we got new calls for different endpoints
      const hasKlineCalls = apiCalls.some(call => call.type === 'kline');
      const hasTradesCalls = apiCalls.some(call => call.type === 'trades');
      const hasOrderCalls = apiCalls.some(call => call.type === 'orders');
      
      console.log('Has new kline calls:', hasKlineCalls);
      console.log('Has new trades calls:', hasTradesCalls);  
      console.log('Has new order calls:', hasOrderCalls);
      
      // Verify the new symbol is reflected in API calls
      const newSymbolInCalls = apiCalls.some(call => 
        call.url.includes(newSymbol.replace('/', '%2F')) || 
        call.url.includes(newSymbol.replace('/', '/'))
      );
      
      console.log('New symbol reflected in API calls:', newSymbolInCalls);
      
      if (!hasKlineCalls && !hasTradesCalls && !hasOrderCalls) {
        console.log('🚨 NO NEW API CALLS DETECTED AFTER SYMBOL SWITCH!');
      }
    }
  });

  test('Check React Query cache behavior', async ({ page }) => {
    // Navigate to trade page
    await page.goto('http://localhost:3001/trade');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    
    // Inject script to check React Query cache
    const cacheInfo = await page.evaluate(() => {
      // Try to access React Query cache through the window
      const queryClient = window.__REACT_QUERY_CACHE__ || 
                         window.__reactQueryClient ||
                         window.queryClient;
      
      if (queryClient && queryClient.getQueryCache) {
        const cache = queryClient.getQueryCache();
        const queries = cache.getAll();
        
        return queries.map(query => ({
          queryKey: query.queryKey,
          state: query.state.status,
          dataUpdatedAt: query.state.dataUpdatedAt
        }));
      }
      
      return null;
    });
    
    if (cacheInfo) {
      console.log('React Query cache entries:');
      cacheInfo.forEach(entry => {
        console.log(`  ${JSON.stringify(entry.queryKey)} - ${entry.state}`);
      });
    } else {
      console.log('Could not access React Query cache');
    }
  });

  test('Check component re-render behavior', async ({ page }) => {
    // Add console logs to detect re-renders
    await page.addInitScript(() => {
      window.renderCounts = {};
      window.logRender = (componentName, props) => {
        window.renderCounts[componentName] = (window.renderCounts[componentName] || 0) + 1;
        console.log(`🔄 ${componentName} render #${window.renderCounts[componentName]}`, props);
      };
    });
    
    await page.goto('http://localhost:3001/trade');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    
    // Get initial render counts
    const initialCounts = await page.evaluate(() => window.renderCounts);
    console.log('Initial render counts:', initialCounts);
    
    // Switch symbol
    const selectorButton = page.getByTestId('symbol-selector-button');
    await selectorButton.click();
    
    const symbolOptions = await page.getByTestId(/^symbol-option-/).all();
    if (symbolOptions.length > 1) {
      await symbolOptions[1].click();
      await page.waitForTimeout(2000);
    }
    
    // Get new render counts
    const newCounts = await page.evaluate(() => window.renderCounts);
    console.log('Render counts after symbol switch:', newCounts);
    
    // Check which components re-rendered
    Object.keys(newCounts).forEach(component => {
      const increase = newCounts[component] - (initialCounts[component] || 0);
      if (increase > 0) {
        console.log(`  ${component} re-rendered ${increase} times`);
      }
    });
  });
});
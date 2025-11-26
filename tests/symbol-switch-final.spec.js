const { test } = require('@playwright/test');

test('Test symbol switching and API behavior', async ({ page }) => {
  test.setTimeout(60000);
  
  const consoleLogs = [];
  const apiCalls = [];
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ text, timestamp: new Date().toISOString() });
    if (text.includes('Chart component') || text.includes('useKline') || text.includes('Trade component') || text.includes('Symbol selector')) {
      console.log('🔍', text);
    }
  });
  
  // Monitor API calls
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/indexer/')) {
      const call = {
        url: url,
        method: request.method(),
        timestamp: new Date().toISOString()
      };
      apiCalls.push(call);
      console.log(`📡 API: ${request.method()} ${url}`);
    }
  });

  console.log('🚀 Navigating to trade page...');
  await page.goto('http://localhost:3001/trade', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log('⏳ Waiting for initial load and symbol selector...');
  await page.waitForTimeout(8000); // Wait for data to load
  
  // Wait specifically for the symbol selector to appear
  const symbolSelector = page.locator('[data-testid="symbol-selector-button"]');
  await symbolSelector.waitFor({ timeout: 10000 });
  
  const initialSymbol = await symbolSelector.textContent();
  console.log('📋 Initial symbol:', initialSymbol?.trim());
  
  // Clear logs and API calls to track only the switch
  const initialApiCount = apiCalls.length;
  consoleLogs.length = 0;
  apiCalls.length = 0;
  
  console.log('🔄 Clicking symbol selector...');
  await symbolSelector.click();
  await page.waitForTimeout(1500);
  
  // Find and click the second option
  const options = page.locator('[data-testid^="symbol-option-"]');
  const optionCount = await options.count();
  console.log('📊 Available options:', optionCount);
  
  if (optionCount >= 2) {
    console.log('🎯 Clicking second symbol option...');
    await options.nth(1).click();
    
    console.log('⏳ Waiting for symbol switch to process...');
    await page.waitForTimeout(5000);
    
    const newSymbol = await symbolSelector.textContent();
    console.log('🆕 New symbol:', newSymbol?.trim());
    
    // Analyze what happened
    console.log(`\\n📊 Results after symbol switch:`);
    console.log(`Initial API calls: ${initialApiCount}`);
    console.log(`API calls after switch: ${apiCalls.length}`);
    console.log(`Symbol changed: ${initialSymbol?.trim() !== newSymbol?.trim()}`);
    
    // Show relevant logs
    const relevantLogs = consoleLogs.filter(log => 
      log.text.includes('Chart component') || 
      log.text.includes('useKline') || 
      log.text.includes('Trade component') || 
      log.text.includes('Symbol selector') ||
      log.text.includes('queryFn executing')
    );
    
    console.log(`\\n📋 Relevant logs (${relevantLogs.length}):`);
    relevantLogs.forEach(log => console.log(`  ${log.text}`));
    
    if (apiCalls.length > 0) {
      console.log('\\n✅ API calls after switch:');
      apiCalls.forEach(call => console.log(`  ${call.method} ${call.url}`));
    } else {
      console.log('\\n❌ NO API CALLS MADE AFTER SYMBOL SWITCH!');
      
      // Check if hooks were even called
      const hookLogs = relevantLogs.filter(log => 
        log.text.includes('useKline hook called') || 
        log.text.includes('Chart component rendered')
      );
      
      if (hookLogs.length === 0) {
        console.log('❌ No component re-rendering detected');
      } else {
        console.log('⚠️ Components re-rendered but no API calls made');
        hookLogs.forEach(log => console.log(`  ${log.text}`));
      }
    }
  } else {
    console.log('⚠️ Not enough symbol options available for testing');
  }
});
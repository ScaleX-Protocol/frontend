const { test } = require('@playwright/test');
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test('Test symbol switching with correct API monitoring', async ({ page }) => {
  test.setTimeout(TestUtils.getTimeout('NAVIGATION', 60000));

  const consoleLogs = [];
  const apiCalls = [];

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ text, timestamp: new Date().toISOString() });
    if (text.includes('Chart component') || text.includes('useKline') || text.includes('Trade component') || text.includes('Symbol selector')) {
      TestUtils.log('🔍 ' + text);
    }
  });

  // Monitor API calls - look for scalex.money domains
  page.on('request', request => {
    const url = request.url();
    if (url.includes('scalex.money') || url.includes('/indexer/') || url.includes('/api/')) {
      const call = {
        url: url,
        method: request.method(),
        timestamp: new Date().toISOString()
      };
      apiCalls.push(call);
      TestUtils.log(`📡 API: ${request.method()} ${url}`);
    }
  });

  TestUtils.log('🚀 Navigating to trade page...');
  await page.goto(TestUtils.getUrl('/trade'), { waitUntil: 'domcontentloaded', timeout: TestUtils.getTimeout('NAVIGATION', 60000) });
  
  console.log('⏳ Waiting for initial load and data...');
  await page.waitForTimeout(8000);
  
  const symbolSelector = page.locator('[data-testid="symbol-selector-button"]');
  await symbolSelector.waitFor({ timeout: 10000 });
  
  const initialSymbol = await symbolSelector.textContent();
  console.log('📋 Initial symbol:', initialSymbol?.trim());
  console.log('📈 Initial API calls:', apiCalls.length);
  
  // Show initial API calls
  if (apiCalls.length > 0) {
    console.log('📡 Initial API calls:');
    apiCalls.forEach(call => console.log(`  ${call.method} ${call.url}`));
  }
  
  // Clear to track only the switch
  consoleLogs.length = 0;
  const beforeSwitchCount = apiCalls.length;
  apiCalls.length = 0;
  
  console.log('\\n🔄 Starting symbol switch...');
  await symbolSelector.click();
  await page.waitForTimeout(1500);
  
  const options = page.locator('[data-testid^="symbol-option-"]');
  const optionCount = await options.count();
  console.log('📊 Available options:', optionCount);
  
  if (optionCount >= 2) {
    console.log('🎯 Clicking second symbol option...');
    await options.nth(1).click();
    
    console.log('⏳ Waiting for API calls after switch...');
    await page.waitForTimeout(8000); // Wait longer for API calls
    
    const newSymbol = await symbolSelector.textContent();
    console.log('🆕 New symbol:', newSymbol?.trim());
    
    console.log(`\\n📊 FINAL RESULTS:`);
    console.log(`API calls before switch: ${beforeSwitchCount}`);
    console.log(`API calls after switch: ${apiCalls.length}`);
    console.log(`Symbol changed: ${initialSymbol?.trim() !== newSymbol?.trim()}`);
    
    if (apiCalls.length > 0) {
      console.log('\\n✅ NEW API CALLS AFTER SWITCH:');
      apiCalls.forEach(call => console.log(`  ${call.method} ${call.url}`));
      
      // Check if new calls include the new symbol
      const symbolInUrls = apiCalls.filter(call => 
        call.url.includes('gsWETH') || call.url.includes('WETH')
      );
      
      console.log(`\\n🎯 API calls with new symbol (WETH): ${symbolInUrls.length}`);
      symbolInUrls.forEach(call => console.log(`  ${call.method} ${call.url}`));
      
      if (symbolInUrls.length > 0) {
        console.log('\\n🎉 SUCCESS: Symbol switching is working correctly!');
      } else {
        console.log('\\n⚠️ API calls made but may not include new symbol');
      }
    } else {
      console.log('\\n❌ NO NEW API CALLS AFTER SWITCH');
      
      // Check what components did
      const hookLogs = consoleLogs.filter(log => 
        log.text.includes('useKline') || 
        log.text.includes('Chart component') || 
        log.text.includes('queryFn executing')
      );
      
      console.log('\\n🔍 Component activity:');
      hookLogs.forEach(log => console.log(`  ${log.text}`));
    }
  } else {
    console.log('⚠️ Not enough symbol options available for testing');
  }
});
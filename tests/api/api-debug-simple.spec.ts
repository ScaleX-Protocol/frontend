const { test, expect } = require('@playwright/test');
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test('Debug API refresh issue', async ({ page }: { page: any }) => {
  const apiCalls: any[] = [];

  // Monitor all network requests
  page.on('request', (request: any) => {
    const url = request.url();
    if (url.includes('/indexer/')) {
      apiCalls.push({
        url: url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      TestUtils.log(`📡 API Request: ${request.method()} ${url}`);
    }
  });

  page.on('response', (response: any) => {
    const url = response.url();
    if (url.includes('/indexer/')) {
      TestUtils.log(`📤 API Response: ${response.status()} ${url}`);
    }
  });

  TestUtils.log('🚀 Navigating to trade page...');
  await page.goto(TestUtils.getUrl('/trade'));
  await page.waitForLoadState('load');
  
  console.log('⏳ Waiting for page to settle...');
  await page.waitForTimeout(5000);
  
  // Take screenshot to see current state
  await page.screenshot({ path: 'debug-trade-page.png', fullPage: true });
  
  // Check if symbol selector exists
  const symbolSelector = page.locator('[data-testid="symbol-selector-button"]');
  const selectorExists = await symbolSelector.count() > 0;
  console.log('🎯 Symbol selector exists:', selectorExists);
  
  if (selectorExists) {
    const selectorText = await symbolSelector.textContent();
    console.log('📋 Current symbol:', selectorText);
    
    // Try to switch symbol
    console.log('🔄 Attempting to switch symbol...');
    await symbolSelector.click();
    await page.waitForTimeout(1000);
    
    // Look for symbol options
    const options = page.locator('[data-testid^="symbol-option-"]');
    const optionCount = await options.count();
    console.log('📊 Available symbol options:', optionCount);
    
    if (optionCount > 1) {
      // Clear API calls array to track only the switch
      const beforeSwitchCount = apiCalls.length;
      apiCalls.length = 0;
      
      console.log('🎯 Clicking second symbol option...');
      await options.nth(1).click();
      
      console.log('⏳ Waiting for API calls after switch...');
      await page.waitForTimeout(3000);
      
      const afterSwitchCount = apiCalls.length;
      console.log(`📈 API calls before switch: ${beforeSwitchCount}`);
      console.log(`📈 API calls after switch: ${afterSwitchCount}`);
      
      if (afterSwitchCount === 0) {
        console.log('🚨 NO API CALLS MADE AFTER SYMBOL SWITCH!');
        
        // Check if symbol actually changed
        const newSelectorText = await symbolSelector.textContent();
        console.log('📋 New symbol text:', newSelectorText);
        console.log('🔄 Symbol text changed:', selectorText !== newSelectorText);
      } else {
        console.log('✅ API calls were made after symbol switch:');
        apiCalls.forEach(call => {
          console.log(`  ${call.method} ${call.url}`);
        });
      }
    } else {
      console.log('⚠️ Not enough symbol options to test switching');
    }
  } else {
    console.log('❌ Symbol selector not found');
    
    // Check what's actually on the page
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Page content preview:', bodyText.substring(0, 500));
    
    // Look for any loading or error states
    const loadingText = await page.locator('text=Loading').count();
    const errorText = await page.locator('text=Error').count();
    const noDataText = await page.locator('text=No market data').count();
    
    console.log('🔄 Loading states found:', loadingText);
    console.log('❌ Error states found:', errorText);
    console.log('📊 No data states found:', noDataText);
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`Total API calls made: ${apiCalls.length}`);
  console.log(`Symbol selector found: ${selectorExists}`);
});
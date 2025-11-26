const { test } = require('@playwright/test');

test('Extended symbol switch test', async ({ page }) => {
  test.setTimeout(90000);
  
  const apiCalls = [];
  
  // Monitor API calls - look for scalex.money domains
  page.on('request', request => {
    const url = request.url();
    if (url.includes('scalex.money')) {
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
  
  console.log('⏳ Waiting for initial load...');
  await page.waitForTimeout(15000); // Wait longer
  
  // Take screenshot to see current state
  await page.screenshot({ path: 'extended-trade-state.png', fullPage: true });
  console.log('📸 Screenshot taken: extended-trade-state.png');
  
  console.log('📈 Total API calls so far:', apiCalls.length);
  apiCalls.forEach(call => console.log(`  ${call.method} ${call.url}`));
  
  // Check if symbol selector appears
  const symbolSelector = page.locator('[data-testid="symbol-selector-button"]');
  const selectorExists = await symbolSelector.count() > 0;
  console.log('🎯 Symbol selector exists:', selectorExists);
  
  if (selectorExists) {
    const symbolText = await symbolSelector.textContent();
    console.log('📋 Current symbol:', symbolText?.trim());
    
    // Clear API calls array to track only the switch
    const beforeSwitchCount = apiCalls.length;
    apiCalls.length = 0;
    
    console.log('🔄 Clicking symbol selector...');
    await symbolSelector.click();
    await page.waitForTimeout(2000);
    
    const options = page.locator('[data-testid^="symbol-option-"]');
    const optionCount = await options.count();
    console.log('📊 Available options:', optionCount);
    
    if (optionCount >= 2) {
      console.log('🎯 Clicking second option...');
      await options.nth(1).click();
      
      console.log('⏳ Waiting for API calls after switch (15 seconds)...');
      await page.waitForTimeout(15000);
      
      const newSymbolText = await symbolSelector.textContent();
      console.log('🆕 New symbol:', newSymbolText?.trim());
      
      console.log(`\\n📊 RESULTS:`);
      console.log(`Initial API calls: ${beforeSwitchCount}`);
      console.log(`API calls after switch: ${apiCalls.length}`);
      console.log(`Symbol changed: ${symbolText?.trim() !== newSymbolText?.trim()}`);
      
      if (apiCalls.length > 0) {
        console.log('\\n✅ API CALLS AFTER SYMBOL SWITCH:');
        apiCalls.forEach(call => {
          console.log(`  ${call.method} ${call.url}`);
          // Check if URL contains the new symbol
          if (call.url.includes('symbol=gsWETH') || call.url.includes('symbol=WETH')) {
            console.log('    ✅ Contains new symbol!');
          }
        });
      } else {
        console.log('\\n❌ NO API CALLS AFTER SYMBOL SWITCH');
      }
    } else {
      console.log('⚠️ Not enough options to test switching');
    }
  } else {
    console.log('❌ Symbol selector not found');
    
    // Check what's actually on the page
    const pageText = await page.locator('body').textContent();
    const preview = pageText.substring(0, 500);
    console.log('📄 Page content preview:', preview);
    
    // Look for any error states
    const errorCount = await page.locator('text=Error').count();
    const loadingCount = await page.locator('text=Loading').count();
    console.log('❌ Error elements:', errorCount);
    console.log('🔄 Loading elements:', loadingCount);
  }
  
  console.log('\\n🏁 Test completed');
});
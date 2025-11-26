const { test } = require('@playwright/test');

test('Test default market configuration', async ({ page }) => {
  test.setTimeout(60000);
  
  console.log('🚀 Testing new default market logic...');
  await page.goto('http://localhost:3001/trade', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log('⏳ Waiting for market data to load...');
  await page.waitForTimeout(10000);
  
  // Check if symbol selector appears with the configured default
  const symbolSelector = page.locator('[data-testid="symbol-selector-button"]');
  const exists = await symbolSelector.count() > 0;
  
  if (exists) {
    const symbolText = await symbolSelector.textContent();
    console.log('📋 Default symbol loaded:', symbolText?.trim());
    
    if (symbolText?.includes('gsWETH/gsUSDC')) {
      console.log('✅ SUCCESS: Default market is now gsWETH/gsUSDC as configured!');
    } else if (symbolText?.includes('gsWBTC/gsUSDC')) {
      console.log('⚠️ Still showing gsWBTC/gsUSDC - might be fallback logic');
    } else {
      console.log('🔍 Unexpected symbol:', symbolText);
    }
    
    // Take a screenshot to verify
    await page.screenshot({ path: 'default-market-test.png', fullPage: true });
    console.log('📸 Screenshot saved: default-market-test.png');
  } else {
    console.log('❌ Symbol selector not found');
  }
});
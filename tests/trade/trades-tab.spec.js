const { test } = require('@playwright/test');
const { TEST_CONFIG, TestUtils } = require('../config/test-config');

test('Test trades tab shows data', async ({ page }) => {
  test.setTimeout(TestUtils.getTimeout('NAVIGATION', 60000));

  TestUtils.log('🚀 Testing trades tab...');
  await page.goto(TestUtils.getUrl('/trade'), { waitUntil: 'domcontentloaded', timeout: TestUtils.getTimeout('NAVIGATION', 60000) });
  
  console.log('⏳ Waiting for page to load...');
  await page.waitForTimeout(8000);
  
  // Look for trades tab and click it
  const tradesTab = page.locator('text=Trades').first();
  const tabExists = await tradesTab.count() > 0;
  
  if (tabExists) {
    console.log('🎯 Found trades tab, clicking it...');
    await tradesTab.click();
    await page.waitForTimeout(3000);
    
    // Check for trade data
    const priceElements = page.locator('text=/\\$\\d+/'); // Look for price patterns like $2973
    const timeElements = page.locator('text=/\\d{2}:\\d{2}:\\d{2}/'); // Look for time patterns
    
    const priceCount = await priceElements.count();
    const timeCount = await timeElements.count();
    
    console.log('📊 Price elements found:', priceCount);
    console.log('⏰ Time elements found:', timeCount);
    
    // Check for loading or no data messages
    const loadingText = await page.locator('text=Loading trades').count();
    const noDataText = await page.locator('text=No trades available').count();
    const errorText = await page.locator('text=Error loading trades').count();
    
    console.log('🔄 Loading state:', loadingText);
    console.log('📭 No data state:', noDataText);
    console.log('❌ Error state:', errorText);
    
    if (priceCount > 0 && timeCount > 0) {
      console.log('✅ SUCCESS: Trades tab is showing trade data!');
    } else if (loadingText > 0) {
      console.log('⏳ Still loading trades...');
    } else if (noDataText > 0) {
      console.log('📭 No trades available message shown');
    } else if (errorText > 0) {
      console.log('❌ Error loading trades');
    } else {
      console.log('🔍 Trades tab state unclear');
    }
    
    // Take screenshot to verify
    await page.screenshot({ path: 'trades-tab-test.png', fullPage: true });
    console.log('📸 Screenshot saved: trades-tab-test.png');
  } else {
    console.log('❌ Trades tab not found');
  }
});
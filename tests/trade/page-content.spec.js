const { test } = require('@playwright/test');
const { TEST_CONFIG, TestUtils } = require('../config/test-config');

test('Check page content', async ({ page }) => {
  test.setTimeout(TestUtils.getTimeout('NAVIGATION', 60000));

  const consoleLogs = [];
  const consoleErrors = [];

  // Capture console logs and errors
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      TestUtils.log('❌ Console Error: ' + text, 'error');
    } else {
      TestUtils.log('🖥️ Console: ' + text);
    }
  });

  TestUtils.log('🚀 Navigating to trade page...');
  await page.goto(TestUtils.getUrl('/trade'), { waitUntil: 'domcontentloaded', timeout: TestUtils.getTimeout('NAVIGATION', 60000) });
  
  console.log('⏳ Waiting for content to load...');
  await page.waitForTimeout(8000);
  
  // Take a screenshot to see what's actually rendered
  await page.screenshot({ path: 'current-trade-page.png', fullPage: true });
  console.log('📸 Screenshot saved as current-trade-page.png');
  
  // Check page structure
  const bodyText = await page.locator('body').textContent();
  console.log('📄 Page body text (first 1000 chars):', bodyText.substring(0, 1000));
  
  // Look for common loading/error states
  const loadingCount = await page.locator('text=Loading').count();
  const errorCount = await page.locator('text=Error').count();
  const noDataCount = await page.locator('text=No market data').count();
  
  console.log('🔄 Elements with "Loading":', loadingCount);
  console.log('❌ Elements with "Error":', errorCount);
  console.log('📊 Elements with "No market data":', noDataCount);
  
  // Check for any elements with trade-related IDs
  const tradeElements = await page.locator('[class*="trade"], [id*="trade"]').count();
  console.log('📈 Trade-related elements:', tradeElements);
  
  // Check specifically for the trade container
  const tradeContainer = await page.locator('.bg-\\[\\#1 A1A1A\\]').count();
  console.log('🎨 Elements with trade page background:', tradeContainer);
  
  console.log('\\n📋 Console errors found:', consoleErrors.length);
  consoleErrors.forEach((error, i) => console.log(`${i + 1}:`, error));
});
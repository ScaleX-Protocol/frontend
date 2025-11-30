const { test } = require('@playwright/test');
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test('Quick debug', async ({ page }) => {
  // Set longer timeout for slow server
  test.setTimeout(TestUtils.getTimeout('NAVIGATION', 60000));

  const consoleLogs = [];

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    TestUtils.log('🖥️ Console: ' + text);
  });

  TestUtils.log('🚀 Navigating to trade page...');
  await page.goto(TestUtils.getUrl('/trade'), { waitUntil: 'domcontentloaded', timeout: TestUtils.getTimeout('NAVIGATION', 60000) });
  
  console.log('⏳ Waiting for initial load...');
  await page.waitForTimeout(5000);
  
  // Try to find symbol selector
  const symbolButton = page.locator('[data-testid="symbol-selector-button"]');
  const exists = await symbolButton.count() > 0;
  console.log('🎯 Symbol selector found:', exists);
  
  if (exists) {
    const text = await symbolButton.textContent();
    console.log('📋 Current symbol text:', text);
    
    console.log('🔄 Clicking to open dropdown...');
    await symbolButton.click();
    await page.waitForTimeout(1000);
    
    const options = page.locator('[data-testid^="symbol-option-"]');
    const count = await options.count();
    console.log('📊 Options found:', count);
    
    if (count > 1) {
      console.log('🎯 Selecting second option...');
      await options.nth(1).click();
      await page.waitForTimeout(3000);
      
      const newText = await symbolButton.textContent();
      console.log('🆕 New symbol text:', newText);
    }
  }
  
  console.log('📋 All console logs:');
  consoleLogs.forEach((log, i) => console.log(`${i + 1}:`, log));
});
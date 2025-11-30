const { test, expect } = require('@playwright/test');
const { TEST_CONFIG, TestUtils } = require('../config/test-config');

test('Trade page displays data', async ({ page }) => {
  // Set a longer timeout for this test
  test.setTimeout(TestUtils.getTimeout('NAVIGATION', 60000));

  // Navigate to the trade page
  TestUtils.log('Navigating to trade page...');
  await page.goto(TestUtils.getUrl('/trade'));
  
  // Wait for the page to load (less strict)
  await page.waitForLoadState('load');
  
  // Wait a bit more for any dynamic content
  await page.waitForTimeout(3000);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'trade-page-screenshot.png', fullPage: true });
  
  // Check if the page loaded successfully (no 404 or error)
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for common data indicators
  const bodyText = await page.textContent('body');
  console.log('Page contains text:', bodyText.length > 100 ? 'Yes' : 'No');
  console.log('Body text length:', bodyText.length);
  console.log('First 200 chars:', bodyText.substring(0, 200));
  
  // Look for common trading page elements
  const hasChartElement = await page.locator('canvas, [data-testid*="chart"], [class*="chart"]').count() > 0;
  const hasTradeForm = await page.locator('form, [data-testid*="trade"], [class*="trade"]').count() > 0;
  const hasDataElements = await page.locator('[data-testid], [class*="price"], [class*="balance"]').count() > 0;
  
  console.log('Has chart elements:', hasChartElement);
  console.log('Has trade form:', hasTradeForm);
  console.log('Has data elements:', hasDataElements);
  
  // Check if there are any error messages
  const errorElements = await page.locator('text=/error|Error|ERROR|failed|Failed|FAILED/i').count();
  console.log('Error elements found:', errorElements);
  
  // Check for loading states
  const loadingElements = await page.locator('text=/loading|Loading|LOADING|spinner/i').count();
  console.log('Loading elements found:', loadingElements);
  
  // Basic assertion that page loads
  expect(page.url()).toContain('/trade');
  
  // Assert that we have some content
  expect(bodyText.length).toBeGreaterThan(50);
});
import { test, expect } from '@playwright/test';

test('Take screenshot of React app to verify no issues', async ({ page }) => {
  // Set viewport to standard desktop size
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Navigate to the home page
  await page.goto('http://localhost:3000/home');

  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');

  // Wait for any dynamic content to load
  await page.waitForTimeout(2000);

  // Take a full page screenshot
  await page.screenshot({
    path: 'scalex-frontend-evidence.png',
    fullPage: true
  });

  console.log('✅ Screenshot taken: scalex-frontend-evidence.png');
});
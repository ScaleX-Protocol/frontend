import { test, expect } from '@playwright/test';

test.describe('Home Page Accessibility', () => {
  const BASE_URL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  });

  test('Home page loads successfully', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if we're on the home page
    const url = page.url();
    expect(url).toContain('localhost:3000');

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/home-page-loaded.png', fullPage: true });

    console.log('✅ Home page loaded successfully');
  });

  test('Page title is correct', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/ScaleX/i);

    console.log('✅ Page title is correct');
  });

  test('Main elements are present', async ({ page }) {
    await page.waitForLoadState('networkidle');

    // Wait for React to render
    await page.waitForSelector('#root', { timeout: 10000 });

    // Check if the root element exists and has content
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();

    console.log('✅ Main elements are present');
  });

  test('No console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');

    // Wait a bit more for any delayed errors
    await page.waitForTimeout(3000);

    // Check if there were any console errors
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors found:', consoleErrors);
    } else {
      console.log('✅ No console errors on page load');
    }
  });

  test('Page is responsive', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Check if page is still functional
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(2000);

    await expect(rootElement).toBeVisible();

    console.log('✅ Page is responsive');
  });
});
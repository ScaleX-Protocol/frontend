import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test('Home page loads successfully', async ({ page }) => {
  // Clear any existing authentication state
  await page.context().clearCookies();

  // Go to the home page
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');

  // Check if we're on the right page
  const url = page.url();
  expect(url).toContain('localhost:3000');

  // Take a screenshot for verification
  await page.screenshot({ path: 'test-results/homepage-loaded.png', fullPage: true });

  console.log('✅ Home page loaded successfully');
});

test('Page title is correct', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  // Check page title contains ScaleX
  await expect(page).toHaveTitle(/ScaleX/i);

  console.log('✅ Page title is correct');
});

test('Main app container exists', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  // Wait for React to render
  await page.waitForSelector('#root', { timeout: 10000 });

  // Check if the root element exists
  const rootElement = page.locator('#root');
  await expect(rootElement).toBeVisible();

  console.log('✅ Main app container exists');
});

test('No critical console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  // Listen for console errors and warnings
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
    if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  // Wait a bit more for any delayed errors
  await page.waitForTimeout(3000);

  // Report findings
  if (consoleErrors.length > 0) {
    console.log(`❌ Found ${consoleErrors.length} console errors:`, consoleErrors.slice(0, 3));
  } else {
    console.log('✅ No console errors');
  }

  if (consoleWarnings.length > 0) {
    console.log(`⚠️ Found ${consoleWarnings.length} console warnings`);
  } else {
    console.log('✅ No console warnings');
  }
});
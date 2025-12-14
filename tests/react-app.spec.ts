import { test, expect } from '@playwright/test';

test.describe('React App Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('app loads successfully', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the page title contains ScaleX
    const title = await page.title();
    expect(title).toContain('ScaleX');
  });

  test('redirects to home page', async ({ page }) => {
    // Check if we're redirected to /home
    await expect(page).toHaveURL(/\/home/);
  });

  test('displays ScaleX branding', async ({ page }) => {
    // Check for ScaleX text on the page
    await expect(page.locator('text=ScaleX')).toBeVisible({ timeout: 10000 });
  });

  test('navigation links work', async ({ page }) => {
    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Try to navigate to different pages
    const navLinks = [
      { href: '/trade', name: 'Trade' },
      { href: '/lending', name: 'Lending' },
      { href: '/faucet', name: 'Faucet' }
    ];

    for (const link of navLinks) {
      await page.goto(link.href);
      await page.waitForLoadState('networkidle');

      // Check if the page loads without errors
      expect(await page.title()).toContain('ScaleX');

      // Take a screenshot for verification
      await page.screenshot({ path: `test-results/${link.name}-page.png` });
    }
  });

  test('no console errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Check if there were any console errors
    expect(errors.length).toBe(0);
  });

  test('app is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Check if app is still functional on mobile
    await expect(page.locator('body')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Check if app is still functional on desktop
    await expect(page.locator('body')).toBeVisible();
  });
});
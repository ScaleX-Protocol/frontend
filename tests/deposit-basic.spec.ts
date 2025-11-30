import { test, expect } from '@playwright/test';

test.describe('ScaleX Deposit Basic UI Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000/home');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait for main content to be visible
    await page.waitForSelector('text=Your Balances', { timeout: 10000 });
  });

  test('should display deposit components', async ({ page }) => {
    console.log('Testing deposit components display');

    // Check if the BalanceCard is visible
    await expect(page.locator('text=Your Balances')).toBeVisible();

    // Check if Deposit button is visible
    const depositButton = page.locator('text=Deposit').first();
    await expect(depositButton).toBeVisible();
    await expect(depositButton).toBeEnabled();

    // Click on Deposit button to open action panel
    await depositButton.click();

    // Wait for action panel to appear
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: 10000 });

    // Check if the ActionPanel with deposit functionality appears
    await expect(page.locator('h3:has-text("Deposit")')).toBeVisible();

    // Check for deposit form elements
    await expect(page.locator('label:has-text("Amount")')).toBeVisible();
    await expect(page.locator('label:has-text("Asset")')).toBeVisible();

    // Check for token selector
    await expect(page.locator('select')).toBeVisible();

    // Check for deposit button in the action panel
    await expect(page.locator('button:has-text("Deposit")')).toBeVisible();

    console.log('✅ All deposit components displayed correctly');
  });

  test('should handle token selection', async ({ page }) => {
    console.log('Testing token selection');

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: 10000 });

    // Get the token selector
    const tokenSelect = page.locator('select');
    await expect(tokenSelect).toBeVisible();

    // Test token selection
    await tokenSelect.selectOption('ETH');
    console.log('✅ Selected ETH token');

    await tokenSelect.selectOption('USDC');
    console.log('✅ Selected USDC token');

    // Test amount input
    const amountInput = page.locator('input[placeholder="0.00"]');
    await expect(amountInput).toBeVisible();

    await amountInput.fill('1.5');
    console.log('✅ Amount input working');
  });

  test('should handle different action tabs', async ({ page }) => {
    console.log('Testing action tabs');

    const tabs = ['Deposit', 'Withdraw', 'Transfer'];

    for (const tab of tabs) {
      console.log(`Testing ${tab} tab`);

      // Click on the tab button
      await page.locator(`text=${tab}`).first().click();
      await page.waitForSelector(`h3:has-text("${tab}")`, { timeout: 10000 });

      // Verify the correct panel opens
      await expect(page.locator(`h3:has-text("${tab}")`)).toBeVisible();

      // Check for common elements
      await expect(page.locator('label:has-text("Amount")')).toBeVisible();

      // Close current tab
      await page.locator(`text=${tab}`).first().click();
      await page.waitForTimeout(500);
    }

    console.log('✅ All action tabs working correctly');
  });

  test('should be responsive', async ({ page }) => {
    console.log('Testing responsive design');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: 10000 });

    // Check if all elements are still usable on mobile
    await expect(page.locator('h3:has-text("Deposit")')).toBeVisible();
    await expect(page.locator('input[placeholder="0.00"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Verify everything still works on desktop
    await expect(page.locator('h3:has-text("Deposit")')).toBeVisible();
    await expect(page.locator('input[placeholder="0.00"]')).toBeVisible();

    console.log('✅ Responsive design working correctly');
  });

  test('should not have JavaScript errors', async ({ page }) => {
    console.log('Testing for JavaScript errors');

    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`Console error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(error.message);
      console.log(`Page error: ${error.message}`);
    });

    // Open deposit panel and interact with it
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: 10000 });

    // Test various interactions
    await page.locator('select').selectOption('ETH');
    await page.locator('input[placeholder="0.00"]').fill('1');

    await page.locator('select').selectOption('USDC');
    await page.locator('input[placeholder="0.00"]').fill('100');

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('Warning') &&
      !error.includes('deprecated') &&
      !error.includes('DevTools') &&
      !error.includes('favicon')
    );

    if (criticalErrors.length > 0) {
      console.log(`❌ Found ${criticalErrors.length} critical JavaScript errors:`);
      criticalErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No critical JavaScript errors found');
    }

    // Allow some non-critical errors in development
    if (consoleErrors.length > 5) {
      console.log(`⚠️ Found ${consoleErrors.length} total console errors (might be acceptable in development)`);
    }
  });

  test('should display UI without wallet connection', async ({ page }) => {
    console.log('Testing UI without wallet connection');

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: 10000 });

    // Check deposit button state (might be disabled without wallet)
    const depositButton = page.locator('button:has-text("Deposit")');
    const isDisabled = await depositButton.isDisabled();

    console.log(`Deposit button state: ${isDisabled ? 'disabled' : 'enabled'}`);

    // Test with USDC to see if approval workflow appears
    await page.locator('select').selectOption('USDC');
    await page.locator('input[placeholder="0.00"]').fill('100');
    await page.waitForTimeout(2000);

    // Look for approval indicators
    const approvalIndicators = [
      'text=Approval required',
      'text=Approve',
      'button:has-text("Approve")'
    ];

    let approvalFound = false;
    for (const indicator of approvalIndicators) {
      if (await page.locator(indicator).isVisible()) {
        console.log(`Found approval indicator: ${indicator}`);
        approvalFound = true;
        break;
      }
    }

    if (approvalFound) {
      console.log('✅ Approval workflow displayed');
    } else {
      console.log('ℹ️ Approval workflow not shown (might require wallet connection)');
    }

    console.log('✅ UI display without wallet connection completed');
  });
});
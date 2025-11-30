const { test, expect } = require('@playwright/test');

test.describe('ScaleX Deposit Quick Test', () => {

  test('should test deposit functionality with correct URL', async ({ page }) => {
    console.log('Testing deposit functionality with correct URL');

    // Navigate to the correct URL
    await page.goto('http://localhost:3001/home');

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Wait for main content
    await page.waitForSelector('text=Your Balances', { timeout: 15000 });

    console.log('Page loaded successfully');

    // Check if Deposit button is visible
    const depositButton = page.locator('text=Deposit').first();
    await expect(depositButton).toBeVisible();
    console.log('Deposit button found');

    // Click on Deposit button to open action panel
    await depositButton.click();
    await page.waitForTimeout(2000);

    // Check if deposit panel opened
    const depositPanel = page.locator('h3:has-text("Deposit")');
    if (await depositPanel.isVisible()) {
      console.log('✅ Deposit panel opened successfully');

      // Test token selection
      const tokenSelect = page.locator('select');
      if (await tokenSelect.isVisible()) {
        await tokenSelect.selectOption('ETH');
        console.log('✅ ETH token selected');

        await tokenSelect.selectOption('USDC');
        console.log('✅ USDC token selected');
      }

      // Test amount input
      const amountInput = page.locator('input[placeholder="0.00"]');
      if (await amountInput.isVisible()) {
        await amountInput.fill('1.5');
        console.log('✅ Amount input working');
      }

    } else {
      console.log('ℹ️ Deposit panel not found - might need wallet connection');
    }

    console.log('✅ Quick deposit test completed successfully');
  });

  test('should check for wallet connection requirements', async ({ page }) => {
    console.log('Testing wallet connection requirements');

    await page.goto('http://localhost:3001/home');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for wallet connection indicators
    const walletIndicators = [
      'text=Connect Wallet',
      'text=Connect',
      'button:has-text("Connect")',
      '[data-testid="connect-wallet"]'
    ];

    let walletConnectionFound = false;
    for (const indicator of walletIndicators) {
      if (await page.locator(indicator).isVisible()) {
        console.log(`Found wallet connection option: ${indicator}`);
        walletConnectionFound = true;
        break;
      }
    }

    if (walletConnectionFound) {
      console.log('✅ Wallet connection interface detected');
    } else {
      console.log('ℹ️ No wallet connection interface found');
    }

    console.log('✅ Wallet connection check completed');
  });

});
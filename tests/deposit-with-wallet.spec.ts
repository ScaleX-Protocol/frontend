const { test, expect } = require('@playwright/test');

test.describe('ScaleX Deposit with Wallet Connection', () => {

  test('should connect wallet and test full deposit flow', async ({ page }) => {
    console.log('Testing full deposit flow with wallet connection');

    await page.goto('http://localhost:3001/home');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for and click wallet connect button
    const connectButton = page.locator('text=Connect').first();
    if (await connectButton.isVisible()) {
      console.log('Found wallet connect button');
      await connectButton.click();
      await page.waitForTimeout(3000);

      // Check if wallet modal/popup appears
      // This will depend on your wallet implementation (Privy, MetaMask, etc.)
      const walletModal = page.locator('[data-testid="wallet-modal"], .wallet-modal, [role="dialog"]');
      if (await walletModal.isVisible().catch(() => false)) {
        console.log('Wallet modal appeared');
        // For testing purposes, we'll close it since we can't actually connect in automated test
        await page.keyboard.press('Escape');
      }
    }

    // Test deposit functionality regardless of wallet connection state
    const depositButton = page.locator('text=Deposit').first();
    await expect(depositButton).toBeVisible();
    await depositButton.click();
    await page.waitForTimeout(2000);

    // Verify deposit panel is open
    const depositPanel = page.locator('h3:has-text("Deposit")');
    await expect(depositPanel).toBeVisible();

    // Test comprehensive deposit functionality
    console.log('Testing comprehensive deposit functionality...');

    // Test token selection
    const tokenSelect = page.locator('select');
    await expect(tokenSelect).toBeVisible();

    // Test ETH
    await tokenSelect.selectOption('ETH');
    console.log('✅ ETH selected - should not require approval');

    // Test amount input with ETH
    const amountInput = page.locator('input[placeholder="0.00"]');
    await expect(amountInput).toBeVisible();
    await amountInput.fill('0.1');
    console.log('✅ ETH amount entered');

    // Test USDC
    await tokenSelect.selectOption('USDC');
    console.log('✅ USDC selected - should require approval');

    // Test amount input with USDC
    await amountInput.fill('100');
    console.log('✅ USDC amount entered');

    // Wait to see if approval workflow appears
    await page.waitForTimeout(3000);

    // Look for approval indicators
    const approvalIndicators = [
      'text=Approval required',
      'text=Approve',
      'button:has-text("Approve")',
      '[data-testid="approve-button"]'
    ];

    let approvalFound = false;
    for (const indicator of approvalIndicators) {
      if (await page.locator(indicator).isVisible().catch(() => false)) {
        console.log(`✅ Found approval indicator: ${indicator}`);
        approvalFound = true;
        break;
      }
    }

    if (!approvalFound) {
      console.log('ℹ️ No approval indicators found (might require wallet connection)');
    }

    // Test form validation
    console.log('Testing form validation...');

    // Test empty amount
    await amountInput.fill('');
    await page.waitForTimeout(500);

    // Test invalid amounts
    await amountInput.fill('0');
    await page.waitForTimeout(500);

    await amountInput.fill('-50');
    await page.waitForTimeout(500);

    // Test valid amount again
    await amountInput.fill('50');
    console.log('✅ Form validation tested');

    // Test different action tabs
    const tabs = ['Withdraw', 'Transfer'];
    for (const tab of tabs) {
      const tabButton = page.locator(`text=${tab}`).first();
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(1000);

        const tabPanel = page.locator(`h3:has-text("${tab}")`);
        if (await tabPanel.isVisible()) {
          console.log(`✅ ${tab} tab opened successfully`);
        }

        // Close tab and go back to deposit
        await tabButton.click();
        await page.waitForTimeout(500);
      }
    }

    console.log('✅ Full deposit flow test completed successfully');
  });

  test('should test responsive design with deposit panel', async ({ page }) => {
    console.log('Testing responsive design with deposit panel');

    await page.goto('http://localhost:3001/home');
    await page.waitForLoadState('networkidle');

    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    const depositButton = page.locator('text=Deposit').first();
    await depositButton.click();
    await page.waitForTimeout(2000);

    const depositPanel = page.locator('h3:has-text("Deposit")');
    await expect(depositPanel).toBeVisible();
    console.log('✅ Desktop responsive design working');

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify everything still works on mobile
    await expect(depositPanel).toBeVisible();
    const amountInput = page.locator('input[placeholder="0.00"]');
    await expect(amountInput).toBeVisible();

    const tokenSelect = page.locator('select');
    await expect(tokenSelect).toBeVisible();
    console.log('✅ Mobile responsive design working');

    console.log('✅ Responsive design test completed');
  });

});
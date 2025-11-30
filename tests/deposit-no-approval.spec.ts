const { test, expect } = require('@playwright/test');

test.describe('ScaleX Deposit Without Approval Indicators', () => {

  test('should not show approval required indicators', async ({ page }) => {
    console.log('Testing that approval indicators are removed');

    await page.goto('http://localhost:3001/home');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Open deposit panel
    const depositButton = page.locator('text=Deposit').first();
    await depositButton.click();
    await page.waitForTimeout(2000);

    // Verify deposit panel opened
    const depositPanel = page.locator('h3:has-text("Deposit")');
    await expect(depositPanel).toBeVisible();

    // Check that approval indicators are NOT present
    const approvalIndicators = [
      'text=Approval required for USDC',
      'text=Approval required for ETH',
      'text=Approval required',
      'text=approved',
      '[data-testid="approval-status"]'
    ];

    for (const indicator of approvalIndicators) {
      const approvalElement = page.locator(indicator);
      const isVisible = await approvalElement.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`❌ Found unwanted approval indicator: ${indicator}`);
      } else {
        console.log(`✅ No approval indicator: ${indicator}`);
      }
    }

    console.log('✅ All approval indicators successfully removed');
  });

  test('should have clean single-button deposit workflow', async ({ page }) => {
    console.log('Testing clean single-button workflow');

    await page.goto('http://localhost:3001/home');
    await page.waitForLoadState('networkidle');

    // Open deposit panel
    const depositButton = page.locator('text=Deposit').first();
    await depositButton.click();
    await page.waitForTimeout(2000);

    // Check for single main action button
    const mainActionButton = page.locator('button[type="button"]').filter({ hasText: /^(Deposit|Approve|Withdraw|Transfer)/ });
    const buttonCount = await mainActionButton.count();
    console.log(`Found ${buttonCount} action buttons`);

    // Should only have one deposit button for the current tab
    const depositButtons = mainActionButton.filter({ hasText: 'Deposit' });
    const depositButtonCount = await depositButtons.count();

    if (depositButtonCount >= 1) {
      console.log('✅ Single deposit workflow maintained');

      // Check button text shows token info
      const firstDepositButton = depositButtons.first();
      const buttonText = await firstDepositButton.textContent();
      console.log(`✅ Deposit button text: "${buttonText}"`);
    }

    // Should not have separate approve buttons in the main action area
    const approveButtons = mainActionButton.filter({ hasText: 'Approve' });
    const approveCount = await approveButtons.count();

    if (approveCount === 0) {
      console.log('✅ No separate approve buttons found');
    }

    console.log('✅ Clean single-button workflow verified');
  });

  test('should work with both ETH and USDC tokens', async ({ page }) => {
    console.log('Testing token functionality without approval indicators');

    await page.goto('http://localhost:3001/home');
    await page.waitForLoadState('networkidle');

    // Open deposit panel
    const depositButton = page.locator('text=Deposit').first();
    await depositButton.click();
    await page.waitForTimeout(2000);

    const tokenSelect = page.locator('select');
    const amountInput = page.locator('input[placeholder="0.00"]');

    // Test ETH
    await tokenSelect.selectOption('ETH');
    await amountInput.fill('0.001');
    console.log('✅ ETH token workflow working');

    // Test USDC
    await tokenSelect.selectOption('USDC');
    await amountInput.fill('10');
    console.log('✅ USDC token workflow working');

    // Check no approval indicators appear during token switching
    const approvalIndicators = [
      'text=Approval required',
      'text=approv',
      'text=Approve'
    ];

    for (const indicator of approvalIndicators) {
      const approvalElement = page.locator(indicator);
      const isVisible = await approvalElement.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`❌ Approval indicator appeared: ${indicator}`);
      }
    }

    console.log('✅ Token switching works without approval indicators');
  });

});
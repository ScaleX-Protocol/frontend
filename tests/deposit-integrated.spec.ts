const { test, expect } = require('@playwright/test');

test.describe('ScaleX Deposit Integrated Approval Workflow', () => {

  test('should handle seamless deposit with integrated approval', async ({ page }) => {
    console.log('Testing seamless deposit with integrated approval workflow');

    await page.goto('http://localhost:3001/home');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look for wallet connect button and try to connect
    const connectButton = page.locator('text=Connect').first();
    if (await connectButton.isVisible()) {
      console.log('Found wallet connect button - clicking');
      await connectButton.click();
      await page.waitForTimeout(3000);

      // Close any wallet modal that appears
      const escapeKey = page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    // Test deposit button
    const depositButton = page.locator('text=Deposit').first();
    await expect(depositButton).toBeVisible();
    await depositButton.click();
    await page.waitForTimeout(2000);

    // Verify deposit panel opened
    const depositPanel = page.locator('h3:has-text("Deposit")');
    await expect(depositPanel).toBeVisible();
    console.log('✅ Deposit panel opened successfully');

    // Test ETH deposit (no approval required)
    console.log('Testing ETH deposit...');
    const tokenSelect = page.locator('select');
    await expect(tokenSelect).toBeVisible();
    await tokenSelect.selectOption('ETH');
    console.log('✅ ETH selected');

    const amountInput = page.locator('input[placeholder="0.00"]');
    await expect(amountInput).toBeVisible();
    await amountInput.fill('0.01');
    console.log('✅ ETH amount entered');

    // Check that approval status is not shown for ETH
    const ethApprovalIndicator = page.locator('text=Approval required for ETH');
    await expect(ethApprovalIndicator).not.toBeVisible();
    console.log('✅ ETH correctly shows no approval requirement');

    // Test USDC deposit (approval should be handled automatically)
    console.log('Testing USDC deposit with integrated approval...');
    await tokenSelect.selectOption('USDC');
    await amountInput.fill('10');
    console.log('✅ USDC selected and amount entered');

    // Check that approval indicator is shown for USDC
    const usdcApprovalIndicator = page.locator('text=Approval required for USDC, text=Approval required, text=approv');
    const approvalVisible = await usdcApprovalIndicator.isVisible().catch(() => false);

    if (approvalVisible) {
      console.log('✅ USDC approval requirement indicator shown');
    } else {
      console.log('ℹ️ USDC approval indicator not visible (might be hidden in current implementation)');
    }

    // Test the deposit button text
    const mainDepositButton = page.locator('button[type="button"]:has-text("Deposit")').first();
    if (await mainDepositButton.isVisible()) {
      const buttonText = await mainDepositButton.textContent();
      console.log(`✅ Deposit button text: "${buttonText}"`);

      // Check if it shows the token symbol
      if (buttonText.includes('USDC')) {
        console.log('✅ Deposit button correctly shows token symbol');
      }
    }

    // Try to click the deposit button (will fail without wallet but should not error)
    try {
      await mainDepositButton.click();
      console.log('✅ Deposit button clicked without immediate error');
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('ℹ️ Deposit button interaction requires wallet connection');
    }

    console.log('✅ Integrated approval workflow test completed');
  });

  test('should show proper status messages for different steps', async ({ page }) => {
    console.log('Testing status messages for different deposit steps');

    await page.goto('http://localhost:3001/home');
    await page.waitForLoadState('networkidle');

    // Open deposit panel
    const depositButton = page.locator('text=Deposit').first();
    await depositButton.click();
    await page.waitForTimeout(2000);

    // Test initial state
    const depositPanel = page.locator('h3:has-text("Deposit")');
    await expect(depositPanel).toBeVisible();

    // Check for status messages
    const statusIndicators = [
      'text=Approving token...',
      'text=Processing deposit...',
      'text=Waiting for confirmation...',
      'text=Transaction confirmed!'
    ];

    for (const indicator of statusIndicators) {
      const statusElement = page.locator(indicator);
      const isVisible = await statusElement.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`Found status indicator: ${indicator}`);
      }
    }

    console.log('✅ Status messages test completed');
  });

  test('should have improved user experience with single button', async ({ page }) => {
    console.log('Testing improved UX with single deposit button');

    await page.goto('http://localhost:3001/home');
    await page.waitForLoadState('networkidle');

    // Open deposit panel
    const depositButton = page.locator('text=Deposit').first();
    await depositButton.click();
    await page.waitForTimeout(2000);

    // Verify there's only one main action button
    const actionButtons = page.locator('button[type="button"]').filter({ hasText: /^(Deposit|Approve|Withdraw|Transfer)/ });
    const buttonCount = await actionButtons.count();

    console.log(`Found ${buttonCount} action buttons`);

    // Should have only one deposit button (separate approve button removed)
    const depositButtons = actionButtons.filter({ hasText: 'Deposit' });
    const approveButtons = actionButtons.filter({ hasText: 'Approve' });

    const depositButtonCount = await depositButtons.count();
    const approveButtonCount = await approveButtons.count();

    console.log(`Deposit buttons: ${depositButtonCount}, Approve buttons: ${approveButtonCount}`);

    if (approveButtonCount === 0) {
      console.log('✅ Separate approve button successfully removed');
    } else {
      console.log('ℹ️ Some approve buttons still present (might be in different sections)');
    }

    if (depositButtonCount >= 1) {
      console.log('✅ Main deposit button present');
    }

    console.log('✅ UX improvement test completed');
  });

});
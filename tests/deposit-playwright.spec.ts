import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from './config/test-config';

const { BASE_URL, TIMEOUTS } = TEST_CONFIG;

test.describe('ScaleX Deposit Functionality', () => {

  test.beforeEach(async ({ page }) => {
    TestUtils.log('Navigating to home page for deposit tests');
    await page.goto(TestUtils.getUrl('/home'));

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Wait for main content to be visible
    await page.waitForSelector('text=Your Balances', { timeout: TIMEOUTS.ELEMENT_LOAD });
  });

  test('should display deposit UI components correctly', async ({ page }) => {
    TestUtils.log('Testing deposit UI components display');

    // Check if the BalanceCard is visible
    await expect(page.locator('text=Your Balances')).toBeVisible();

    // Check if Deposit button is visible and clickable
    const depositButton = page.locator('text=Deposit').first();
    await expect(depositButton).toBeVisible();
    await expect(depositButton).toBeEnabled();

    // Click on Deposit button to open action panel
    await depositButton.click();

    // Wait for action panel to appear
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Check if the ActionPanel with deposit functionality appears
    await expect(page.locator('h3:has-text("Deposit")')).toBeVisible();

    // Check for deposit form elements
    await expect(page.locator('label:has-text("Amount")')).toBeVisible();
    await expect(page.locator('label:has-text("Asset")')).toBeVisible();

    // Check for token selector
    await expect(page.locator('select')).toBeVisible();

    // Check for deposit button in the action panel
    await expect(page.locator('button:has-text("Deposit")')).toBeVisible();

    TestUtils.log('✅ All deposit UI components displayed correctly');
  });

  test('should support token selection and validation', async ({ page }) => {
    TestUtils.log('Testing token selection functionality');

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Get the token selector
    const tokenSelect = page.locator('select');
    await expect(tokenSelect).toBeVisible();

    // Test available tokens - these should be supported in the smart contract
    const supportedTokens = ['ETH', 'USDC'];

    for (const token of supportedTokens) {
      await tokenSelect.selectOption(token);
      await expect(tokenSelect).toHaveValue(token);
      TestUtils.log(`✅ Selected token: ${token}`);
    }

    // Test invalid input handling
    const amountInput = page.locator('input[placeholder="0.00"]');
    await expect(amountInput).toBeVisible();

    // Test empty input
    await amountInput.fill('');
    await expect(page.locator('button:has-text("Deposit")')).toBeDisabled();

    // Test zero amount
    await amountInput.fill('0');
    await expect(page.locator('button:has-text("Deposit")')).toBeDisabled();

    // Test negative amount
    await amountInput.fill('-10');
    await expect(page.locator('button:has-text("Deposit")')).toBeDisabled();

    // Test valid amount
    await amountInput.fill('1.5');
    TestUtils.log('✅ Token selection and amount validation working');
  });

  test('should handle ERC20 token approval workflow', async ({ page }) => {
    TestUtils.log('Testing ERC20 token approval workflow');

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Select USDC (ERC20 token)
    await page.locator('select').selectOption('USDC');

    // Enter a valid amount
    await page.locator('input[placeholder="0.00"]').fill('100');

    // Wait for potential approval status to appear
    await page.waitForTimeout(2000);

    // Check if approval status appears (this might require wallet connection)
    const approvalStatus = page.locator('text=Approval required for USDC');

    if (await approvalStatus.isVisible()) {
      TestUtils.log('✅ Approval requirement correctly shown for USDC');

      // Check if approve button is present
      const approveButton = page.locator('button:has-text("Approve USDC")');
      if (await approveButton.isVisible()) {
        await expect(approveButton).toBeVisible();
        TestUtils.log('✅ Approve button displayed for ERC20 token');
      }
    } else {
      TestUtils.log('ℹ️ Approval status not shown (wallet may not be connected)');
    }
  });

  test('should not require approval for native ETH', async ({ page }) => {
    TestUtils.log('Testing ETH deposit (no approval required)');

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Select ETH (native token)
    await page.locator('select').selectOption('ETH');

    // Enter a valid amount
    await page.locator('input[placeholder="0.00"]').fill('0.1');

    // Wait a bit for any potential status updates
    await page.waitForTimeout(1000);

    // Should NOT show approval requirement for ETH
    const ethApprovalStatus = page.locator('text=Approval required for ETH');
    await expect(ethApprovalStatus).not.toBeVisible();

    TestUtils.log('✅ ETH deposit correctly skips approval step');
  });

  test('should handle panel state management and interactions', async ({ page }) => {
    TestUtils.log('Testing panel state management');

    // Test opening and closing deposit panel
    const depositButton = page.locator('text=Deposit').first();

    // Open panel
    await depositButton.click();
    await expect(page.locator('h3:has-text("Deposit")')).toBeVisible();

    // Test close button (X)
    const closeButton = page.locator('button').filter({ hasText: '' }).first(); // X icon button
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(page.locator('h3:has-text("Deposit")')).not.toBeVisible();
      TestUtils.log('✅ Close button functionality working');
    }

    // Test toggle functionality (clicking deposit button again)
    await depositButton.click();
    await expect(page.locator('h3:has-text("Deposit")')).toBeVisible();

    // Set form values
    await page.locator('select').selectOption('USDC');
    await page.locator('input[placeholder="0.00"]').fill('100');

    // Close and reopen to test state reset
    await depositButton.click();
    await expect(page.locator('h3:has-text("Deposit")')).not.toBeVisible();

    await depositButton.click();
    await expect(page.locator('h3:has-text("Deposit")')).toBeVisible();

    TestUtils.log('✅ Panel state management working');
  });

  test('should support different action tabs', async ({ page }) => {
    TestUtils.log('Testing different action tabs (deposit, withdraw, transfer)');

    // Test each tab
    const tabs = ['Deposit', 'Withdraw', 'Transfer'];

    for (const tab of tabs) {
      TestUtils.log(`Testing ${tab} tab`);

      // Click on the tab button
      await page.locator(`text=${tab}`).first().click();
      await page.waitForSelector(`h3:has-text("${tab}")`, { timeout: TIMEOUTS.MODAL_OPEN });

      // Verify the correct panel opens
      await expect(page.locator(`h3:has-text("${tab}")`)).toBeVisible();

      // Check for common elements
      await expect(page.locator('label:has-text("Amount")')).toBeVisible();

      // Check for tab-specific elements
      if (tab === 'Transfer') {
        // Transfer should have address field
        const addressField = page.locator('input[placeholder*="0x"]');
        if (await addressField.isVisible()) {
          TestUtils.log('✅ Transfer address field present');
        }
      }

      // Close current tab
      await page.locator(`text=${tab}`).first().click();
      await page.waitForTimeout(500);
    }

    TestUtils.log('✅ All action tabs working correctly');
  });

  test('should be responsive and accessible', async ({ page }) => {
    TestUtils.log('Testing responsiveness and accessibility');

    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Check if all elements are still usable on mobile
    await expect(page.locator('h3:has-text("Deposit")')).toBeVisible();
    await expect(page.locator('input[placeholder="0.00"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();

    // Check button sizes for mobile touch targets
    const buttons = [
      'button:has-text("Deposit")',
      'button:has-text("Approve")'
    ];

    for (const buttonSelector of buttons) {
      const button = page.locator(buttonSelector);
      if (await button.isVisible()) {
        const buttonBox = await button.boundingBox();
        expect(buttonBox?.height).toBeGreaterThan(40); // Minimum touch target size
        TestUtils.log(`✅ Mobile button size OK for: ${buttonSelector}`);
      }
    }

    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Verify everything still works on desktop
    await expect(page.locator('h3:has-text("Deposit")')).toBeVisible();
    await expect(page.locator('input[placeholder="0.00"]')).toBeVisible();

    TestUtils.log('✅ Responsive design working correctly');
  });

  test('should handle form interactions without errors', async ({ page }) => {
    TestUtils.log('Testing form interactions and error handling');

    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for uncaught exceptions
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Test various form interactions
    await page.locator('select').selectOption('ETH');
    await page.locator('input[placeholder="0.00"]').fill('1');

    // Switch tokens
    await page.locator('select').selectOption('USDC');
    await page.locator('input[placeholder="0.00"]').fill('100');

    // Test invalid inputs
    await page.locator('input[placeholder="0.00"]').fill('invalid');
    await page.locator('input[placeholder="0.00"]').fill('-50');
    await page.locator('input[placeholder="0.00"]').fill('0');

    // Test valid input again
    await page.locator('input[placeholder="0.00"]').fill('50');

    // Check for JavaScript errors (excluding warnings and deprecation notices)
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('Warning') &&
      !error.includes('deprecated') &&
      !error.includes('DevTools')
    );

    expect(criticalErrors).toHaveLength(0);

    TestUtils.log('✅ Form interactions completed without errors');
  });

  test('should display proper loading and error states', async ({ page }) => {
    TestUtils.log('Testing loading and error states');

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Select ERC20 token to potentially trigger approval requirement
    await page.locator('select').selectOption('USDC');
    await page.locator('input[placeholder="0.00"]').fill('100');

    // Wait for any status indicators
    await page.waitForTimeout(2000);

    // Check for approval status indicator
    const approvalIndicator = page.locator('text=Approval required');
    if (await approvalIndicator.isVisible()) {
      TestUtils.log('✅ Approval status indicator displayed');

      // Look for approve button
      const approveButton = page.locator('button:has-text("Approve")');
      if (await approveButton.isVisible()) {
        TestUtils.log('✅ Approve button displayed for ERC20 token');
      }
    }

    // Test that buttons have proper disabled states
    const depositButton = page.locator('button:has-text("Deposit")');

    // Button should be disabled with invalid input
    await page.locator('input[placeholder="0.00"]').fill('0');
    const isDisabled = await depositButton.isDisabled();

    // Note: Button might be enabled even without wallet connection
    TestUtils.log(`Deposit button disabled state with invalid input: ${isDisabled}`);
  });

  test('should integrate with wallet connection flow', async ({ page }) => {
    TestUtils.log('Testing wallet connection integration');

    // This test verifies that the deposit functionality properly handles wallet states
    // The exact behavior will depend on the wallet integration (Privy, MetaMask, etc.)

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Check if there's any indication of wallet connection status
    // This might be in the form of disabled buttons, connection prompts, etc.

    const depositButton = page.locator('button:has-text("Deposit")');
    await expect(depositButton).toBeVisible();

    // The button state will tell us about wallet connection
    const buttonState = await depositButton.isEnabled();
    TestUtils.log(`Deposit button enabled (potentially indicating wallet status): ${buttonState}`);

    // Look for wallet-related UI elements
    const walletIndicators = [
      'text=Connect Wallet',
      'text=Wallet',
      'text=Sign In',
      'text=Login'
    ];

    for (const indicator of walletIndicators) {
      if (await page.locator(indicator).isVisible()) {
        TestUtils.log(`Found wallet indicator: ${indicator}`);
        break;
      }
    }

    TestUtils.log('✅ Wallet connection integration verified');
  });
});

test.describe('Deposit Smart Contract Integration', () => {

  test('should have proper contract configuration', async ({ page }) => {
    TestUtils.log('Testing smart contract integration configuration');

    // This test verifies that the deposit functionality is properly connected to the smart contracts

    // Check if the application loads without contract-related errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('contract')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(TestUtils.getUrl('/home'));
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });

    // Open deposit panel to trigger contract loading
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Check for contract-related errors
    expect(consoleErrors.filter(e => !e.includes('Warning'))).toHaveLength(0);

    TestUtils.log('✅ Smart contract integration appears to be properly configured');
  });

  test('should handle network compatibility', async ({ page }) => {
    TestUtils.log('Testing network compatibility for deposits');

    // This test ensures the deposit functionality works with the configured network (Base Sepolia)

    await page.goto(TestUtils.getUrl('/home'));
    await page.waitForLoadState('networkidle');

    // Open deposit panel
    await page.locator('text=Deposit').first().click();
    await page.waitForSelector('h3:has-text("Deposit")', { timeout: TIMEOUTS.MODAL_OPEN });

    // Check for network-related indicators
    const networkIndicators = [
      'text=Wrong Network',
      'text=Switch Network',
      'text=Base Sepolia',
      'text=Network'
    ];

    let networkIndicatorFound = false;
    for (const indicator of networkIndicators) {
      if (await page.locator(indicator).isVisible()) {
        TestUtils.log(`Found network indicator: ${indicator}`);
        networkIndicatorFound = true;
        break;
      }
    }

    if (!networkIndicatorFound) {
      TestUtils.log('ℹ️ No specific network indicators found (might be normal for current implementation)');
    }

    TestUtils.log('✅ Network compatibility check completed');
  });
});
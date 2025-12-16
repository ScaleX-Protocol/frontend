const { test, expect } = require('@playwright/test');

test.describe('Privy Connect Button Test', () => {
  test('should not throw PrivyProvider error when clicking Connect', async ({ page }) => {
    // Array to collect console messages
    const consoleMessages = [];
    const errors = [];

    // Listen to console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      console.log(`[${msg.type()}] ${text}`);
    });

    // Listen to page errors
    page.on('pageerror', error => {
      errors.push(error.message);
      console.error('Page error:', error.message);
    });

    console.log('\n🌐 Navigating to http://localhost:4173/home...\n');

    // Navigate to the home page
    await page.goto('http://localhost:4173/home', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n✅ Page loaded successfully\n');

    // Wait a bit for any initial renders
    await page.waitForTimeout(2000);

    console.log('\n🔍 Looking for Connect button...\n');

    // Find the Connect button
    const connectButton = page.locator('button:has-text("Connect")');

    // Check if button exists
    const buttonExists = await connectButton.count() > 0;
    console.log(`Connect button found: ${buttonExists}`);

    if (!buttonExists) {
      console.log('\n⚠️  Connect button not found! Possible reasons:');
      console.log('   1. User might already be connected');
      console.log('   2. Button might have different text');
      console.log('   3. Page might not have loaded properly\n');

      // Take a screenshot for debugging
      await page.screenshot({ path: 'connect-button-not-found.png', fullPage: true });
      console.log('📸 Screenshot saved as connect-button-not-found.png');

      return;
    }

    // Wait for button to be visible
    await connectButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Connect button is visible\n');

    console.log('🖱️  Clicking Connect button...\n');

    // Click the Connect button
    await connectButton.click();

    console.log('✅ Connect button clicked\n');

    // Wait a bit for any errors to appear
    await page.waitForTimeout(2000);

    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(70) + '\n');

    // Check for Privy-related errors
    const privyErrors = errors.filter(err =>
      err.includes('PrivyProvider') ||
      err.includes('useWallets') ||
      err.includes('wrap your application')
    );

    const privyErrorMessages = consoleMessages.filter(msg =>
      msg.type === 'error' && (
        msg.text.includes('PrivyProvider') ||
        msg.text.includes('useWallets') ||
        msg.text.includes('wrap your application')
      )
    );

    console.log(`Total page errors: ${errors.length}`);
    console.log(`Privy-related errors: ${privyErrors.length}`);
    console.log(`Privy-related console errors: ${privyErrorMessages.length}\n`);

    if (privyErrors.length > 0) {
      console.log('❌ FAILED: Privy errors detected:\n');
      privyErrors.forEach(err => console.log(`   - ${err}`));
      console.log('');
    }

    if (privyErrorMessages.length > 0) {
      console.log('❌ FAILED: Privy console errors detected:\n');
      privyErrorMessages.forEach(msg => console.log(`   - ${msg.text}`));
      console.log('');
    }

    // Check for specific error messages
    const hasPrivyProviderError = [...errors, ...privyErrorMessages.map(m => m.text)].some(err =>
      err.includes('wrap your application with the <PrivyProvider>')
    );

    const hasUseWalletsError = [...errors, ...consoleMessages.map(m => m.text)].some(msg =>
      msg.includes('useWallets') && msg.includes('outside')
    );

    console.log('Specific error checks:');
    console.log(`  - "wrap your application" error: ${hasPrivyProviderError ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`  - "useWallets outside" error: ${hasUseWalletsError ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log('');

    console.log('='.repeat(70));

    if (hasPrivyProviderError || hasUseWalletsError) {
      console.log('❌ TEST FAILED: Privy initialization errors detected');
      console.log('='.repeat(70) + '\n');

      // Take a screenshot
      await page.screenshot({ path: 'privy-error.png', fullPage: true });
      console.log('📸 Screenshot saved as privy-error.png\n');

      throw new Error('Privy provider error detected when clicking Connect button');
    } else {
      console.log('✅ TEST PASSED: No Privy errors detected!');
      console.log('='.repeat(70) + '\n');
    }

    // Additional check: Verify Privy modal or login flow started
    await page.waitForTimeout(1000);

    // Check if Privy modal appeared (this would indicate successful initialization)
    const privyModal = page.locator('[data-testid="privy-modal"], [role="dialog"], .privy-modal, iframe[title*="Privy"]');
    const modalVisible = await privyModal.count() > 0;

    console.log(`Privy login modal appeared: ${modalVisible ? '✅ YES' : '⚠️  NO (might be expected)'}\n`);

    if (modalVisible) {
      console.log('🎉 SUCCESS: Privy login flow initiated successfully!\n');
      await page.screenshot({ path: 'privy-modal-success.png', fullPage: true });
      console.log('📸 Screenshot saved as privy-modal-success.png\n');
    }
  });
});

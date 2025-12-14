import { test, expect } from '@playwright/test';

test.describe('Privy Provider Test', () => {
  test('should have PrivyProvider properly configured', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);

      if (text.includes('Privy') || text.includes('privy')) {
        console.log(`[CONSOLE] ${text}`);
      }

      if (msg.type() === 'error') {
        console.log(`[ERROR] ${text}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
      if (error.message.includes('PrivyProvider')) {
        console.log('❌ PrivyProvider error detected:', error.message);
      }
    });

    console.log('🔍 Navigating to http://localhost:3001/trade');
    await page.goto('http://localhost:3001/trade');

    // Wait for the page to load and check for Privy errors
    await page.waitForTimeout(5000);

    // Check for PrivyProvider errors
    const privyErrors = consoleMessages.filter(msg =>
      msg.includes('PrivyProvider') &&
      (msg.includes('wrap your application') || msg.includes('app id'))
    );

    if (privyErrors.length > 0) {
      console.log('\n❌ PrivyProvider Errors Found:');
      privyErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('\n✅ No PrivyProvider errors detected');
    }

    // Check if VITE_PRIVY_APP_ID is loaded
    const hasPrivyId = consoleMessages.some(msg =>
      msg.includes('cmi4buwlg010ijv0dlp768ac4') // The Privy App ID
    );

    if (hasPrivyId) {
      console.log('✅ Privy App ID is loaded');
    }

    // Assert that no Privy provider errors occur
    expect(privyErrors.length).toBe(0, `PrivyProvider errors detected: ${privyErrors.join(', ')}`);

    console.log('✅ PrivyProvider test completed successfully');
  });
});
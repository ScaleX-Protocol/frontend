const { test } = require('@playwright/test');

test('Check authentication state in production', async ({ page }) => {
  const consoleMessages = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`[${msg.type()}] ${text}`);
  });

  console.log('\n🌐 Navigating to http://localhost:4173/home...\n');

  await page.goto('http://localhost:4173/home', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log('\n✅ Page loaded\n');

  // Wait for React to render
  await page.waitForTimeout(3000);

  // Get localStorage data
  const localStorageData = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return data;
  });

  console.log('\n📦 LocalStorage data:');
  console.log(JSON.stringify(localStorageData, null, 2));

  // Check for Privy-related keys
  const privyKeys = Object.keys(localStorageData).filter(k => k.includes('privy'));
  console.log('\n🔑 Privy-related keys:', privyKeys);

  // Filter relevant console logs
  const walletLogs = consoleMessages.filter(msg =>
    msg.includes('[useWalletState]') ||
    msg.includes('[Home]') ||
    msg.includes('Authenticated') ||
    msg.includes('Ready')
  );

  console.log('\n📊 Wallet State Logs:');
  walletLogs.forEach(log => console.log(log));
});

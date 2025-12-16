const playwright = require('playwright');

(async () => {
  console.log('🧪 Testing balance display fix on production...\n');

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Track API calls
  const apiCalls = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('lending') && url.includes('dashboard')) {
      apiCalls.push({
        url: url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log('📡 Lending Dashboard API called:', url);
    }
  });

  // Track console errors
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      errors.push(text);
      if (text.includes('WagmiProvider') || text.includes('wagmi')) {
        console.log('❌ Wagmi error detected:', text);
      }
    }
  });

  try {
    console.log('1. Navigating to home page...');
    await page.goto('https://base-sepolia-app.scalex.money', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any deferred API calls
    await page.waitForTimeout(5000);

    console.log('\n2. Checking for API calls...');
    if (apiCalls.length > 0) {
      console.log(`✅ Lending dashboard API called ${apiCalls.length} time(s)`);
      apiCalls.forEach((call, i) => {
        console.log(`   ${i + 1}. ${call.method} ${call.url}`);
        // Check if URL contains "Not Created" - this would be bad
        if (call.url.includes('Not%20Created') || call.url.includes('Not+Created')) {
          console.log('   ⚠️  WARNING: API called with "Not Created" address!');
        }
      });
    } else {
      console.log('⚠️  No lending dashboard API calls detected');
    }

    console.log('\n3. Checking for errors...');
    const wagmiErrors = errors.filter(e => e.includes('WagmiProvider') || e.includes('wagmi'));
    if (wagmiErrors.length > 0) {
      console.log('❌ Wagmi-related errors found:');
      wagmiErrors.forEach(e => console.log('   -', e));
    } else {
      console.log('✅ No WagmiProvider errors detected');
    }

    console.log('\n4. Taking screenshot...');
    await page.screenshot({ path: 'balance-fix-test.png', fullPage: true });
    console.log('✅ Screenshot saved to balance-fix-test.png');

    console.log('\n📊 Test Summary:');
    console.log('   - API Calls:', apiCalls.length);
    console.log('   - Wagmi Errors:', wagmiErrors.length);
    console.log('   - Total Console Errors:', errors.length);

    if (apiCalls.length > 0 && wagmiErrors.length === 0) {
      console.log('\n✅ Fix appears to be working correctly!');
    } else {
      console.log('\n⚠️  Some issues detected - check details above');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();

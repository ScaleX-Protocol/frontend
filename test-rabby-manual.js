const playwright = require('playwright');

(async () => {
  console.log('🧪 Manual Rabby Wallet Test - Production Site\n');
  console.log('Opening browser for manual testing with Rabby wallet...\n');

  // Launch browser in non-headless mode for manual testing
  const browser = await playwright.chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
    ]
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: timestamp
    });

    // Print relevant logs immediately
    if (text.includes('[Home]') || text.includes('[useWalletState]')) {
      console.log(`[${timestamp}] 📝 ${text}`);
    }
  });

  // Track API calls
  const apiCalls = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('lending') && url.includes('dashboard')) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      apiCalls.push({
        url: url,
        method: request.method(),
        timestamp: timestamp
      });
      console.log(`\n[${timestamp}] 🌐 API Request: ${request.method()} ${url}`);
    }
  });

  // Track API responses
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('lending') && url.includes('dashboard')) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      try {
        const body = await response.json();
        apiResponses.push({
          url: url,
          status: response.status(),
          body: body,
          timestamp: timestamp
        });
        console.log(`[${timestamp}] ✅ API Response: Status ${response.status()}`);
        console.log(`   User: ${url.split('/dashboard/')[1]?.split('?')[0]}`);
        console.log(`   Supplies: ${body?.supplies?.length || 0}`);
        console.log(`   Borrows: ${body?.borrows?.length || 0}`);

        if (body?.supplies?.length > 0) {
          console.log(`   Sample supply:`, JSON.stringify(body.supplies[0], null, 2));
        }
      } catch (e) {
        console.log(`[${timestamp}] ⚠️  API Response: Status ${response.status()} (non-JSON)`);
      }
    }
  });

  try {
    console.log('1. Opening production site...');
    await page.goto('https://base-sepolia-app.scalex.money', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n✅ Browser opened successfully!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 MANUAL TEST INSTRUCTIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('   1. Click the "Connect" button');
    console.log('   2. Log in using your Rabby wallet');
    console.log('   3. Watch the console logs below');
    console.log('   4. Check if the home page shows your balances');
    console.log('   5. The browser will stay open for 5 minutes\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('EXPECTED BEHAVIOR:');
    console.log('   ✓ [useWalletState] should show your Rabby wallet address');
    console.log('   ✓ [Home] Active wallet: should show your address (0x...)');
    console.log('   ✓ [Home] Enabled condition: should be TRUE');
    console.log('   ✓ API request should be made with your wallet address');
    console.log('   ✓ Balance data should load and display\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Keep browser open for 5 minutes to allow manual testing
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(10000); // Wait 10 seconds

      // Every 30 seconds, print summary
      if (i % 3 === 0 && i > 0) {
        console.log(`\n⏱️  ${Math.floor(i / 6) * 2} minutes elapsed...`);
        console.log(`   Console logs captured: ${consoleLogs.length}`);
        console.log(`   API calls made: ${apiCalls.length}`);
        console.log(`   API responses received: ${apiResponses.length}\n`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Print relevant logs
    const walletLogs = consoleLogs.filter(log =>
      log.text.includes('[useWalletState]') || log.text.includes('[Home]')
    );

    console.log(`Total relevant logs captured: ${walletLogs.length}\n`);

    if (walletLogs.length > 0) {
      console.log('Last 20 relevant logs:');
      walletLogs.slice(-20).forEach((log, i) => {
        console.log(`   ${i + 1}. [${log.timestamp}] ${log.text}`);
      });
    }

    console.log(`\n\nTotal API calls: ${apiCalls.length}`);
    console.log(`Total API responses: ${apiResponses.length}`);

    if (apiResponses.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 SUCCESS! API was called:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      apiResponses.forEach((resp, i) => {
        console.log(`   ${i + 1}. [${resp.timestamp}] ${resp.url}`);
        console.log(`      Status: ${resp.status}`);
        console.log(`      Supplies: ${resp.body?.supplies?.length || 0}`);
        console.log(`      Borrows: ${resp.body?.borrows?.length || 0}\n`);
      });
    } else {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  NO API CALLS - Check if you logged in properly');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    console.log('\n📸 Taking final screenshot...');
    await page.screenshot({ path: 'rabby-manual-test.png', fullPage: true });
    console.log('✅ Screenshot saved to rabby-manual-test.png\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
})();

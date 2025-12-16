const playwright = require('playwright');

(async () => {
  console.log('🧪 Manual Login Test - Chrome Browser with Extensions\n');
  console.log('This will open a Chrome browser window where you can manually log in.');
  console.log('The browser will stay open for 5 minutes to capture logs.\n');

  // Launch Chrome with a visible UI (not headless)
  const browser = await playwright.chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
    ]
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Capture all console logs
  const consoleLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: timestamp
    });

    // Print Home-related logs immediately with timestamp
    if (text.includes('[Home]')) {
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
      console.log(`[${timestamp}] 📡 API Request: ${url}`);
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
        console.log(`[${timestamp}] 📥 API Response: Status ${response.status()}`);
        console.log(`   Supplies: ${body?.supplies?.length || 0}, Borrows: ${body?.borrows?.length || 0}`);

        if (body?.supplies?.length > 0) {
          console.log(`   Sample supply:`, JSON.stringify(body.supplies[0], null, 2));
        }
      } catch (e) {
        console.log(`[${timestamp}] 📥 API Response: Status ${response.status()} (non-JSON)`);
      }
    }
  });

  // Track errors
  page.on('pageerror', (error) => {
    console.log('❌ Page Error:', error.message);
  });

  try {
    console.log('1. Opening production site...');
    await page.goto('https://base-sepolia-app.scalex.money', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n✅ Browser opened successfully!');
    console.log('\n📋 INSTRUCTIONS:');
    console.log('   1. Please log in manually using the Connect button');
    console.log('   2. Complete the authentication process');
    console.log('   3. Wait for the home page to load');
    console.log('   4. Watch the console logs below');
    console.log('   5. The browser will stay open for 5 minutes\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Keep browser open for 5 minutes to allow manual testing
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(10000); // Wait 10 seconds

      // Every 30 seconds, print summary
      if (i % 3 === 0 && i > 0) {
        console.log(`\n⏱️  ${Math.floor(i / 6) * 2} minutes elapsed...`);
        console.log(`   Total [Home] logs: ${consoleLogs.filter(l => l.text.includes('[Home]')).length}`);
        console.log(`   Total API calls: ${apiCalls.length}`);
        console.log(`   Total API responses: ${apiResponses.length}\n`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Print all [Home] logs
    const homeLogs = consoleLogs.filter(log => log.text.includes('[Home]'));
    console.log(`Total [Home] logs captured: ${homeLogs.length}\n`);

    if (homeLogs.length > 0) {
      console.log('Last 10 [Home] logs:');
      homeLogs.slice(-10).forEach((log, i) => {
        console.log(`   ${i + 1}. [${log.timestamp}] ${log.text}`);
      });
    }

    console.log(`\nTotal API calls: ${apiCalls.length}`);
    console.log(`Total API responses: ${apiResponses.length}`);

    if (apiResponses.length > 0) {
      console.log('\nAPI Response Summary:');
      apiResponses.forEach((resp, i) => {
        console.log(`   ${i + 1}. [${resp.timestamp}] Status ${resp.status}`);
        console.log(`      Supplies: ${resp.body?.supplies?.length || 0}`);
        console.log(`      Borrows: ${resp.body?.borrows?.length || 0}`);
      });
    }

    console.log('\n📸 Taking final screenshot...');
    await page.screenshot({ path: 'manual-login-test.png', fullPage: true });
    console.log('✅ Screenshot saved to manual-login-test.png\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
})();

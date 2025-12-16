const playwright = require('playwright');

(async () => {
  console.log('🧪 Testing console logs on production...\n');

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Capture all console logs
  const consoleLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });

    // Print Home-related logs immediately
    if (text.includes('[Home]')) {
      console.log(`📝 ${text}`);
    }
  });

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
      console.log('📡 API Request:', url);
    }
  });

  // Track API responses
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('lending') && url.includes('dashboard')) {
      try {
        const body = await response.json();
        apiResponses.push({
          url: url,
          status: response.status(),
          body: body,
          timestamp: new Date().toISOString()
        });
        console.log('📥 API Response:', url, '- Status:', response.status());
        console.log('   Supplies:', body?.supplies?.length || 0);
        console.log('   Borrows:', body?.borrows?.length || 0);
        console.log('   Summary:', body?.summary);
      } catch (e) {
        console.log('📥 API Response:', url, '- Status:', response.status(), '(non-JSON)');
      }
    }
  });

  try {
    console.log('1. Navigating to home page...');
    await page.goto('https://base-sepolia-app.scalex.money', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n2. Waiting for initial render...');
    await page.waitForTimeout(5000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CONSOLE LOGS ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Filter and display [Home] logs
    const homeLogs = consoleLogs.filter(log => log.text.includes('[Home]'));

    if (homeLogs.length === 0) {
      console.log('⚠️  No [Home] logs found');
      console.log('   This might mean:');
      console.log('   - Home component did not render');
      console.log('   - Privy is not ready');
      console.log('   - Page did not fully load');
    } else {
      console.log('✅ Found [Home] logs:\n');
      homeLogs.forEach(log => {
        console.log(`   ${log.text}`);
      });

      // Parse specific values
      const walletLog = homeLogs.find(l => l.text.includes('Wallet address:'));
      const enabledLog = homeLogs.find(l => l.text.includes('Enabled condition:'));
      const chainIdLog = homeLogs.find(l => l.text.includes('ChainId:'));
      const lendingDataLog = homeLogs.find(l => l.text.includes('Lending data:'));

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 DETAILED ANALYSIS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (walletLog) {
        const address = walletLog.text.split('Wallet address:')[1]?.trim();
        console.log('💼 Wallet Address:', address);
        if (address === 'Not Created') {
          console.log('   ⚠️  Wallet not created - user not authenticated');
        } else if (address && address.startsWith('0x')) {
          console.log('   ✅ Valid wallet address detected');
        }
      }

      if (enabledLog) {
        const enabled = enabledLog.text.split('Enabled condition:')[1]?.trim();
        console.log('🔐 Enabled Condition:', enabled);
        if (enabled === 'false') {
          console.log('   ⚠️  Query is disabled - API will not be called');
        } else {
          console.log('   ✅ Query is enabled - API should be called');
        }
      }

      if (chainIdLog) {
        const chainId = chainIdLog.text.split('ChainId:')[1]?.trim();
        console.log('⛓️  Chain ID:', chainId);
      }

      if (lendingDataLog) {
        console.log('📊 Lending Data:', lendingDataLog.text.split('Lending data:')[1]?.trim());
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 API ACTIVITY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Total API Calls: ${apiCalls.length}`);
    console.log(`Total API Responses: ${apiResponses.length}\n`);

    if (apiResponses.length > 0) {
      apiResponses.forEach((resp, i) => {
        console.log(`Response ${i + 1}:`);
        console.log(`  URL: ${resp.url}`);
        console.log(`  Status: ${resp.status}`);
        console.log(`  Supplies: ${resp.body?.supplies?.length || 0}`);
        console.log(`  Borrows: ${resp.body?.borrows?.length || 0}`);

        if (resp.body?.supplies?.length > 0) {
          console.log(`  Sample Supply:`, JSON.stringify(resp.body.supplies[0], null, 4));
        }
        console.log('');
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 CONCLUSION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Determine the issue
    if (homeLogs.length === 0) {
      console.log('❌ Home component not rendering - check Privy initialization');
    } else {
      const walletLog = homeLogs.find(l => l.text.includes('Wallet address:'));
      const address = walletLog?.text.split('Wallet address:')[1]?.trim();

      if (address === 'Not Created') {
        console.log('✅ Working as expected - user not authenticated, no API calls');
      } else if (apiResponses.length === 0) {
        console.log('❌ Wallet connected but API not called - check enabled condition logic');
      } else {
        const hasData = apiResponses.some(r => r.body?.supplies?.length > 0);
        if (hasData) {
          console.log('✅ Everything working - API called and returned data');
        } else {
          console.log('⚠️  API called but returned empty data - check backend or user has no assets');
        }
      }
    }

    console.log('\n4. Taking screenshot...');
    await page.screenshot({ path: 'console-logs-test.png', fullPage: true });
    console.log('✅ Screenshot saved to console-logs-test.png\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();

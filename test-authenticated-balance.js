const playwright = require('playwright');

(async () => {
  console.log('🧪 Testing authenticated balance display on production...\n');

  const browser = await playwright.chromium.launch({ headless: false }); // visible for debugging
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Track all network activity
  const apiCalls = [];
  const apiResponses = [];

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('lending') || url.includes('dashboard')) {
      apiCalls.push({
        url: url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log('📡 API Request:', url);
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('lending') || url.includes('dashboard')) {
      try {
        const body = await response.json();
        apiResponses.push({
          url: url,
          status: response.status(),
          body: body,
          timestamp: new Date().toISOString()
        });
        console.log('📥 API Response:', url, '- Status:', response.status());
        console.log('   Body:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('📥 API Response:', url, '- Status:', response.status(), '(non-JSON)');
      }
    }
  });

  // Track console messages
  const errors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
      console.log('❌ Console error:', text);
    } else if (msg.type() === 'log' && text.includes('wallet')) {
      console.log('📝 Console log:', text);
    }
  });

  try {
    console.log('1. Navigating to home page...');
    await page.goto('https://base-sepolia-app.scalex.money', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n2. Waiting for page to stabilize...');
    await page.waitForTimeout(3000);

    console.log('\n3. Checking for login button...');
    // Try to find and click login button
    const loginButton = await page.$('button:has-text("Connect")');
    if (loginButton) {
      console.log('✅ Found login/connect button');
      console.log('⚠️  Test paused - Please manually:');
      console.log('   1. Click the Connect/Login button');
      console.log('   2. Complete the authentication process');
      console.log('   3. Wait for the home page to load with your wallet connected');
      console.log('   4. Press Enter in this terminal to continue...\n');

      // Wait for user to press Enter
      await new Promise(resolve => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question('Press Enter after logging in...', () => {
          readline.close();
          resolve();
        });
      });
    }

    console.log('\n4. Waiting for authenticated API calls...');
    await page.waitForTimeout(5000);

    console.log('\n5. Analyzing results...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 API CALLS SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (apiCalls.length === 0) {
      console.log('❌ No API calls detected');
    } else {
      console.log(`✅ Total API calls: ${apiCalls.length}`);
      apiCalls.forEach((call, i) => {
        console.log(`\n   ${i + 1}. ${call.method} ${call.url}`);
        if (call.url.includes('Not%20Created') || call.url.includes('Not+Created')) {
          console.log('      ⚠️  WARNING: Called with "Not Created" address!');
        }
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 API RESPONSES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (apiResponses.length === 0) {
      console.log('❌ No API responses captured');
    } else {
      apiResponses.forEach((resp, i) => {
        console.log(`\n   ${i + 1}. Status: ${resp.status}`);
        console.log(`      URL: ${resp.url}`);

        // Check if response has supplies data
        if (resp.body && resp.body.supplies) {
          console.log(`      Supplies count: ${resp.body.supplies.length}`);
          if (resp.body.supplies.length > 0) {
            console.log(`      First supply:`, JSON.stringify(resp.body.supplies[0], null, 6));
          } else {
            console.log('      ⚠️  Empty supplies array');
          }
        }

        // Check summary data
        if (resp.body && resp.body.summary) {
          console.log(`      Summary:`, JSON.stringify(resp.body.summary, null, 6));
        }
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 CHECKING PAGE CONTENT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if balance cards are visible
    const balanceText = await page.textContent('body').catch(() => '');
    if (balanceText.includes('Portfolio Asset') || balanceText.includes('Earn Asset')) {
      console.log('✅ Balance cards found on page');
    } else {
      console.log('⚠️  Balance cards not found');
    }

    console.log('\n6. Taking screenshot...');
    await page.screenshot({ path: 'authenticated-balance-test.png', fullPage: true });
    console.log('✅ Screenshot saved to authenticated-balance-test.png');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 FINAL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   API Calls: ${apiCalls.length}`);
    console.log(`   API Responses: ${apiResponses.length}`);
    console.log(`   Console Errors: ${errors.length}`);

    // Wait before closing so user can see the browser
    console.log('\nBrowser will remain open for inspection. Close manually or wait 30s...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();

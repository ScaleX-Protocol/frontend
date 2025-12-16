const playwright = require('playwright');
const { exec } = require('child_process');

(async () => {
  console.log('Testing PRODUCTION Build Locally');
  console.log('This simulates the exact deployment environment\n');

  const previewProcess = exec('cd apps/web && pnpm run preview:base-sepolia', {cwd: process.cwd()});
  await new Promise(resolve => setTimeout(resolve, 3000));

  const browser = await playwright.chromium.launch({headless: false});
  const context = await browser.newContext({viewport: {width: 1920, height: 1080}});
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    consoleLogs.push({type: msg.type(), text, timestamp});
    if (text.includes('[useWalletState]') || text.includes('[Home]')) {
      console.log(`[${timestamp}] ${text}`);
    }
  });

  const apiCalls = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('lending') && url.includes('dashboard')) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      apiCalls.push({url, method: request.method(), timestamp});
      console.log(`[${timestamp}] API Request: ${request.method()} ${url}`);
    }
  });

  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('lending') && url.includes('dashboard')) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      try {
        const body = await response.json();
        apiResponses.push({url, status: response.status(), body, timestamp});
        console.log(`[${timestamp}] API Response: Status ${response.status()}`);
        console.log(`   Supplies: ${body?.supplies?.length || 0}, Borrows: ${body?.borrows?.length || 0}`);
      } catch (e) {}
    }
  });

  page.on('pageerror', (error) => console.log('Page Error:', error.message));

  try {
    console.log('Opening production build at http://localhost:4173...\n');
    await page.goto('http://localhost:4173', {waitUntil: 'networkidle', timeout: 30000});

    console.log('Production build loaded successfully!\n');
    console.log('INSTRUCTIONS:\n');
    console.log('   1. Click the "Connect" button');
    console.log('   2. Log in using your Rabby wallet');
    console.log('   3. Watch the console logs below');
    console.log('   4. The browser will stay open for 5 minutes\n');

    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(10000);
      if (i % 3 === 0 && i > 0) {
        console.log(`\n${Math.floor(i / 6) * 2} minutes elapsed...`);
        console.log(`   Console logs: ${consoleLogs.length}, API calls: ${apiCalls.length}\n`);
      }
    }

    console.log('\nFINAL SUMMARY:\n');
    const walletLogs = consoleLogs.filter(log => 
      log.text.includes('[useWalletState]') || log.text.includes('[Home]')
    );
    console.log(`Total relevant logs: ${walletLogs.length}\n`);
    if (walletLogs.length > 0) {
      console.log('Last 20 relevant logs:');
      walletLogs.slice(-20).forEach((log, i) => {
        console.log(`   ${i + 1}. [${log.timestamp}] ${log.text}`);
      });
    }

    console.log(`\nTotal API calls: ${apiCalls.length}`);
    console.log(`Total API responses: ${apiResponses.length}`);

    if (apiResponses.length > 0) {
      console.log('\nSUCCESS! API was called:\n');
      apiResponses.forEach((resp, i) => {
        console.log(`   ${i + 1}. [${resp.timestamp}] ${resp.url}`);
        console.log(`      Status: ${resp.status}, Supplies: ${resp.body?.supplies?.length || 0}\n`);
      });
    } else {
      console.log('\nNO API CALLS - Check if you logged in properly');
    }

    await page.screenshot({path: 'production-test.png', fullPage: true});
    console.log('Screenshot saved to production-test.png\n');

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    console.log('Closing browser and preview server...');
    await browser.close();
    previewProcess.kill();
  }
})();

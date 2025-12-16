const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`[CONSOLE ${msg.type()}] ${text}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log('Navigating to http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });

    console.log('Waiting 2 seconds for page to load...');
    await page.waitForTimeout(2000);

    console.log('Looking for Connect button...');
    const connectButton = await page.locator('button:has-text("Connect")').first();

    if (await connectButton.isVisible()) {
      console.log('Connect button found, clicking...');
      await connectButton.click();

      console.log('Waiting 3 seconds after click...');
      await page.waitForTimeout(3000);
    } else {
      console.log('Connect button not found');
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors found: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach(err => console.log(err));
    }

    console.log('\nKeeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();

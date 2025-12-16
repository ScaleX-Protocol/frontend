const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[CONSOLE ${type.toUpperCase()}] ${text}`);
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
    console.log(error.stack);
  });

  // Listen for failed requests
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('Navigating to https://base-sepolia-app.scalex.money/home');
    await page.goto('https://base-sepolia-app.scalex.money/home', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n=== Page loaded successfully ===');

    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check for error elements
    const errorText = await page.evaluate(() => {
      const body = document.body.innerText;
      return body;
    });

    console.log('\n=== Page content preview (first 500 chars) ===');
    console.log(errorText.substring(0, 500));

    // Take a screenshot
    await page.screenshot({ path: 'production-test.png', fullPage: true });
    console.log('\nScreenshot saved to production-test.png');

  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();

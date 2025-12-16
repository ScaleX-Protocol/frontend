const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // Bypass cache
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  // Set cache control headers
  await page.setExtraHTTPHeaders({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  });

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

  // Listen for responses to check bundle hash
  page.on('response', response => {
    const url = response.url();
    if (url.includes('index-') && url.includes('.js')) {
      console.log(`[BUNDLE] Loaded: ${url}`);
    }
  });

  try {
    console.log('Navigating to https://base-sepolia-app.scalex.money/home with cache bypass');
    await page.goto('https://base-sepolia-app.scalex.money/home?nocache=' + Date.now(), {
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
    await page.screenshot({ path: 'production-test-nocache.png', fullPage: true });
    console.log('\nScreenshot saved to production-test-nocache.png');

  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup for ScaleX deposit tests');

  // You can add any global setup here, such as:
  // - Starting local blockchain/testnet
  // - Deploying test contracts
  // - Setting up test data
  // - Starting test services

  // For example, you could check if local dev server is running
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Check if the development server is running
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    await page.goto(baseUrl, { timeout: 10000 });
    console.log(`✅ Development server is running at ${baseUrl}`);
  } catch (error) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    console.log(`❌ Development server not found at ${baseUrl}`);
    console.log('Please start the development server with: npm run dev');
    process.exit(1);
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('✅ Global setup completed');
}

export default globalSetup;
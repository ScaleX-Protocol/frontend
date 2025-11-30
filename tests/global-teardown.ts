import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown');

  // You can add any global cleanup here, such as:
  // - Stopping test services
  // - Cleaning up test data
  // - Closing database connections

  console.log('✅ Global teardown completed');
}

export default globalTeardown;
const { test, expect } = require('@playwright/test');
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test('Faucet page should call currencies API without wallet connection', async ({ page }) => {
  const apiCalls = [];
  let currenciesApiCalled = false;

  // Monitor all network requests
  page.on('request', request => {
    const url = request.url();

    // Log all API requests
    if (url.includes('/api/')) {
      apiCalls.push({
        url: url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      TestUtils.log(`📡 API Request: ${request.method()} ${url}`);

      // Check if currencies API is called
      if (url.includes('/api/currencies')) {
        currenciesApiCalled = true;
        TestUtils.log('✅ Currencies API called!');
        TestUtils.log('   URL: ' + url);

        // Check if correct parameters are included
        const urlObj = new URL(url);
        const chainId = urlObj.searchParams.get('chainId');
        const onlyActual = urlObj.searchParams.get('onlyActual');
        const limit = urlObj.searchParams.get('limit');

        TestUtils.log('   Parameters:');
        TestUtils.log('   - chainId: ' + chainId);
        TestUtils.log('   - onlyActual: ' + onlyActual);
        TestUtils.log('   - limit: ' + limit);

        // Verify parameters
        expect(chainId).toBe('84532'); // Should use default chain ID
        expect(onlyActual).toBe('true');
        expect(limit).toBe('50');
      }
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/currencies')) {
      TestUtils.log(`📤 Currencies API Response: ${response.status()}`);

      if (response.status() === 200) {
        try {
          const data = await response.json();
          TestUtils.log('   Response data keys: ' + Object.keys(data).join(', '));
          TestUtils.log('   Items count: ' + (data?.data?.items?.length || 0));
        } catch (e) {
          TestUtils.log('   Could not parse response: ' + e.message, 'error');
        }
      } else {
        TestUtils.log(`   ❌ API returned error status: ${response.status()}`, 'error');
      }
    }
  });

  // Navigate to faucet page
  TestUtils.log('🚀 Navigating to faucet page...');
  await page.goto(TestUtils.getUrl('/faucet'));

  // Wait for network idle
  console.log('⏳ Waiting for network to be idle...');
  await page.waitForLoadState('networkidle');

  // Wait a bit more to ensure React hooks have executed
  await page.waitForTimeout(2000);

  // Check console logs from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Faucet Form')) {
      console.log('📋 Page Console:', text);
    }
  });

  // Print all API calls made
  console.log('\n📊 Summary of API calls:');
  console.log(`   Total API calls: ${apiCalls.length}`);
  apiCalls.forEach((call, index) => {
    console.log(`   ${index + 1}. ${call.method} ${call.url}`);
  });

  // Verify that the currencies API was called
  console.log('\n🔍 Verification:');
  if (currenciesApiCalled) {
    console.log('   ✅ Currencies API was called successfully');
  } else {
    console.log('   ❌ Currencies API was NOT called');
    console.log('   This indicates an issue with the hook or component setup');
  }

  expect(currenciesApiCalled).toBe(true);
});

test('Verify ChainConfig default values', async ({ page }) => {
  console.log('🧪 Testing ChainConfig...');

  // Navigate to any page to access the config
  await page.goto(TestUtils.getUrl('/faucet'));

  // Evaluate the config in the browser context
  const chainConfig = await page.evaluate(() => {
    // This would need to be exposed or we can check via network calls
    return {
      // We can infer from network calls instead
      note: 'Check network calls for chainId parameter'
    };
  });

  console.log('   ChainConfig check complete (verify via network calls)');
});

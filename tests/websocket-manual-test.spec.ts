import { test, expect } from '@playwright/test';

test.describe('WebSocket Manual Test', () => {
  test('manually check WebSocket subscription system', async ({ page }) => {
    await page.goto('http://localhost:3001/trade');

    // Wait for the page to load completely
    await page.waitForTimeout(5000);

    // Take a screenshot to see the current state
    await page.screenshot({ path: 'websocket-test-state.png', fullPage: true });

    // Check if the WebSocket test component is visible
    const testComponent = page.locator('text=WebSocket Test Status');
    await expect(testComponent).toBeVisible({ timeout: 10000 });

    // Check connection state
    const connectionState = await page.locator('text=Connection State:').locator('..').locator('div').nth(1).textContent();
    console.log('Connection State:', connectionState);

    // Check subscription ready state
    const subscriptionReady = await page.locator('text=Subscription Ready:').locator('..').locator('div').nth(1).textContent();
    console.log('Subscription Ready:', subscriptionReady);

    // Check active subscriptions
    const activeSubscriptionsElement = page.locator('text=Active Subscriptions:');
    let activeSubscriptions = '';

    if (await activeSubscriptionsElement.isVisible()) {
      activeSubscriptions = await activeSubscriptionsElement.locator('..').locator('div').nth(1).textContent();
      console.log('Active Subscriptions:', activeSubscriptions);
    }

    // Wait a bit more for potential subscriptions
    await page.waitForTimeout(5000);

    // Check again for subscriptions
    if (await activeSubscriptionsElement.isVisible()) {
      activeSubscriptions = await activeSubscriptionsElement.locator('..').locator('div').nth(1).textContent();
      console.log('Active Subscriptions (after 5s):', activeSubscriptions);
    }

    // Check for any recent messages
    const recentMessagesElement = page.locator('text=Recent Messages:');
    if (await recentMessagesElement.isVisible()) {
      const messages = await recentMessagesElement.locator('..').locator('.text-blue-400').allTextContents();
      console.log('Recent Messages:', messages);
    }

    // Log what we found
    console.log('\n📊 WebSocket Test Results:');
    console.log(`   • Connection: ${connectionState}`);
    console.log(`   • Ready: ${subscriptionReady}`);
    console.log(`   • Subscriptions: ${activeSubscriptions || 'None'}`);

    // Basic assertions
    expect(connectionState).toBeDefined();
    expect(subscriptionReady).toBeDefined();
  });
});
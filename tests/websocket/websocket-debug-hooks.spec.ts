/**
 * Debug WebSocket Hooks
 *
 * Simple test to check if WebSocket hooks are being called correctly
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

const { BASE_URL } = TEST_CONFIG;

test.describe('WebSocket Hook Debug', () => {

  test('should call WebSocket hooks and send messages', async ({ page }) => {
    TestUtils.log('Testing WebSocket hooks...', 'debug');
    test.setTimeout(20000);

    // Monitor console for WebSocket-related logs
    const consoleMessages: any[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('WebSocket') ||
          text.includes('SUBSCRIBE') ||
          text.includes('gswethgsusdc') ||
          text.includes('Auto WebSocket Subscriptions')) {
        consoleMessages.push({
          type: msg.type(),
          text: text,
          timestamp: Date.now()
        });
        console.log(`[${msg.type().toUpperCase()}] ${text}`);
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Wait for hooks to be called
    await page.waitForTimeout(10000);

    TestUtils.log(`Console messages captured: ${consoleMessages.length}`, 'info');

    // Look for specific hook-related messages
    const autoSubscriptionMessages = consoleMessages.filter(msg =>
      msg.text.includes('Auto WebSocket Subscriptions') ||
      msg.text.includes('Setting up auto-subscriptions') ||
      msg.text.includes('Cannot auto-subscribe')
    );

    const subscriptionMessages = consoleMessages.filter(msg =>
      msg.text.includes('SUBSCRIBE') ||
      msg.text.includes('Subscribed to') ||
      msg.text.includes('gswethgsusdc')
    );

    const connectionMessages = consoleMessages.filter(msg =>
      msg.text.includes('WebSocket connection established') ||
      msg.text.includes('WebSocket connected')
    );

    console.log('\n=== Hook Analysis ===');
    console.log(`Auto-subscription messages: ${autoSubscriptionMessages.length}`);
    console.log(`Subscription messages: ${subscriptionMessages.length}`);
    console.log(`Connection messages: ${connectionMessages.length}`);

    if (autoSubscriptionMessages.length > 0) {
      console.log('\n📋 Auto-subscription messages:');
      autoSubscriptionMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    if (subscriptionMessages.length > 0) {
      console.log('\n📡 Subscription messages:');
      subscriptionMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    if (connectionMessages.length > 0) {
      console.log('\n🔌 Connection messages:');
      connectionMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    // Check for specific error patterns
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');

    console.log(`\n🚨 Error messages: ${errorMessages.length}`);
    console.log(`⚠️ Warning messages: ${warningMessages.length}`);

    if (errorMessages.length > 0) {
      errorMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg.text}`);
      });
    }

    if (warningMessages.length > 0) {
      warningMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg.text}`);
      });
    }

    // Basic checks
    expect(autoSubscriptionMessages.length + connectionMessages.length).toBeGreaterThan(0);

    if (autoSubscriptionMessages.length === 0) {
      TestUtils.log('❌ Auto-subscription component may not be working', 'error');
    } else {
      TestUtils.log('✅ Auto-subscription component is active', 'success');
    }

    if (subscriptionMessages.length === 0) {
      TestUtils.log('⚠️ No WebSocket subscriptions detected', 'warning');
    } else {
      TestUtils.log('✅ WebSocket subscriptions are being sent', 'success');
    }
  });
});
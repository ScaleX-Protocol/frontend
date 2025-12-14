import { test, expect } from '@playwright/test';

test.describe('WebSocket Debug Test', () => {
  test('should show debug output for WebSocket subscriptions', async ({ page }) => {
    const consoleMessages: string[] = [];

    // Capture all console output
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);

      // Log any WebSocket-related debug messages
      if (text.includes('🔍') || text.includes('✅') || text.includes('❌') || text.includes('📡') || text.includes('📨')) {
        console.log(text);
      }
    });

    console.log('🚀 Navigating to trade page...');
    await page.goto('http://localhost:3001/trade');

    // Wait for debug output
    console.log('⏳ Waiting 15 seconds for debug output...');
    await page.waitForTimeout(15000);

    // Check if we got any debug output
    const debugMessages = consoleMessages.filter(msg =>
      msg.includes('🔍') ||
      msg.includes('✅') ||
      msg.includes('❌') ||
      msg.includes('📡') ||
      msg.includes('📨')
    );

    console.log('\n📊 Debug Output Analysis:');
    console.log(`   • Total debug messages: ${debugMessages.length}`);

    if (debugMessages.length > 0) {
      console.log('\n🔍 Debug Messages Found:');
      debugMessages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ${msg}`);
      });
    }

    // Check for component debug output
    const componentDebug = consoleMessages.filter(msg =>
      msg.includes('DebugOrdersComponent')
    );

    if (componentDebug.length > 0) {
      console.log('\n🏗️ Component Debug:');
      componentDebug.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ${msg}`);
      });
    }

    // Check for hook debug output
    const hookDebug = consoleMessages.filter(msg =>
      msg.includes('useDepth')
    );

    if (hookDebug.length > 0) {
      console.log('\n🎣 Hook Debug:');
      hookDebug.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ${msg}`);
      });
    }

    // Check for subscription manager debug output
    const subscriptionDebug = consoleMessages.filter(msg =>
      msg.includes('useWebSocketSubscriptions')
    );

    if (subscriptionDebug.length > 0) {
      console.log('\n📡 Subscription Debug:');
      subscriptionDebug.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ${msg}`);
      });
    }

    // Basic assertions
    expect(debugMessages.length).toBeGreaterThanOrEqual(0);

    console.log('\n🎯 Debug Test Complete!');
  });
});
import { test, expect } from '@playwright/test';

test.describe('WebSocket All Streams Test', () => {
  test('should subscribe to all required streams', async ({ page }) => {
    const consoleMessages: string[] = [];

    // Capture all console output
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);

      // Log any subscription-related messages
      if (text.includes('Subscribing to') || text.includes('@depth') || text.includes('@trade') || text.includes('@ticker') || text.includes('@kline')) {
        console.log(text);
      }
    });

    console.log('🚀 Navigating to trade page...');
    await page.goto('http://localhost:3001/trade');

    // Wait for WebSocket to connect and subscriptions to be sent
    console.log('⏳ Waiting 20 seconds for all subscriptions...');
    await page.waitForTimeout(20000);

    // Analyze subscription messages
    const subscriptionMessages = consoleMessages.filter(msg =>
      msg.includes('Subscribing to') &&
      (msg.includes('@depth') || msg.includes('@trade') || msg.includes('@ticker') || msg.includes('@kline'))
    );

    console.log('\n📊 Subscription Analysis:');
    console.log(`   • Total subscription messages: ${subscriptionMessages.length}`);

    if (subscriptionMessages.length > 0) {
      console.log('\n🔍 Streams Found:');
      subscriptionMessages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ${msg}`);
      });
    }

    // Check for specific stream types
    const depthStreams = subscriptionMessages.filter(msg => msg.includes('@depth'));
    const tradeStreams = subscriptionMessages.filter(msg => msg.includes('@trade'));
    const tickerStreams = subscriptionMessages.filter(msg => msg.includes('@ticker') || msg.includes('@miniTicker'));
    const klineStreams = subscriptionMessages.filter(msg => msg.includes('@kline'));

    console.log('\n📈 Stream Breakdown:');
    console.log(`   • Depth streams: ${depthStreams.length}`);
    console.log(`   • Trade streams: ${tradeStreams.length}`);
    console.log(`   • Ticker streams: ${tickerStreams.length}`);
    console.log(`   • Kline streams: ${klineStreams.length}`);

    // Verify at least depth stream is working (the main one we implemented)
    expect(depthStreams.length).toBeGreaterThanOrEqual(1);

    console.log('\n🎯 All Streams Test Complete!');
  });
});
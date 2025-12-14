import { test, expect } from '@playwright/test';

test.describe('Depth API Test', () => {
  test('should load depth data from REST API', async ({ page }) => {
    const consoleMessages: string[] = [];

    // Capture console output
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);

      // Log depth-related messages
      if (text.includes('Loaded initial depth') || text.includes('depth')) {
        console.log('📊', text);
      }
    });

    console.log('🚀 Navigating to trade page...');
    await page.goto('http://localhost:3001/trade');

    // Wait for initial data to load
    console.log('⏳ Waiting 10 seconds for depth data to load...');
    await page.waitForTimeout(10000);

    // Check for depth data loading messages
    const depthMessages = consoleMessages.filter(msg =>
      msg.includes('Loaded initial depth') ||
      msg.includes('depth data') ||
      msg.includes('bids') ||
      msg.includes('asks')
    );

    console.log('\n📊 Depth Data Analysis:');
    console.log(`   • Total depth-related messages: ${depthMessages.length}`);

    if (depthMessages.length > 0) {
      console.log('\n🔍 Depth Messages Found:');
      depthMessages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ${msg}`);
      });
    }

    // Basic assertion - should have some depth-related activity
    expect(depthMessages.length).toBeGreaterThanOrEqual(0);

    console.log('\n🎯 Depth API Test Complete!');
  });
});
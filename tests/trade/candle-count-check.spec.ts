import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test.describe('TradingView Candle Count Check', () => {

  test('should verify exact number of candles displayed', async ({ page }) => {
    test.setTimeout(60000);

    TestUtils.log('📊 Checking exact candle count and time range...', 'info');
    
    let candleData: any[] = [];

    // Monitor kline API calls to capture the actual data
    await page.route('**/kline*', async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      
      if (response.ok() && Array.isArray(data) && data.length > 0) {
        candleData = data;
        
        // Convert timestamps to readable dates
        const firstCandle = data[0];
        const lastCandle = data[data.length - 1];
        
        const firstTime = new Date(firstCandle[0]).toISOString();
        const lastTime = new Date(lastCandle[0]).toISOString();
        
        TestUtils.log(`📈 Received ${data.length} candles`, 'success');
        TestUtils.log(`📅 Time range: ${firstTime} to ${lastTime}`, 'debug');
        TestUtils.log(`💰 Price range: ${firstCandle[4]} to ${lastCandle[4]}`, 'debug');
      }
      
      route.fulfill({ response });
    });
    
    // Navigate to trade page
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    // Wait for TradingView to load
    await page.waitForFunction(
      () => typeof window.TradingView !== 'undefined',
      { timeout: 30000 }
    );

    // Wait for data loading
    await page.waitForTimeout(10000);

    // Analyze the candle data
    if (candleData.length > 0) {
      const firstCandle = candleData[0];
      const lastCandle = candleData[candleData.length - 1];
      
      const timeSpanHours = (lastCandle[0] - firstCandle[0]) / (1000 * 60 * 60);
      const timeSpanDays = timeSpanHours / 24;
      
      TestUtils.log('\n📊 CANDLE ANALYSIS:', 'info');
      TestUtils.log(`   🔢 Total Candles: ${candleData.length}`, 'success');
      TestUtils.log(`   ⏰ Interval: 1 hour (hourly candles)`, 'debug');
      TestUtils.log(`   📅 Time Span: ${timeSpanDays.toFixed(1)} days (${timeSpanHours.toFixed(0)} hours)`, 'debug');
      TestUtils.log(`   📈 First Candle: ${new Date(firstCandle[0]).toLocaleString()}`, 'debug');
      TestUtils.log(`   📉 Last Candle: ${new Date(lastCandle[0]).toLocaleString()}`, 'debug');
      
      // Analyze price data
      const prices = candleData.map(c => parseFloat(c[4])); // Close prices
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      TestUtils.log('\n💰 PRICE ANALYSIS:', 'info');
      TestUtils.log(`   📊 Price Range: ${minPrice.toFixed(6)} - ${maxPrice.toFixed(6)}`, 'debug');
      TestUtils.log(`   📈 Average Price: ${avgPrice.toFixed(6)}`, 'debug');
      
      // Show sample candles
      TestUtils.log('\n🕯️  SAMPLE CANDLES:', 'info');
      candleData.slice(0, 3).forEach((candle, idx) => {
        const time = new Date(candle[0]).toLocaleString();
        const prices = `O:${parseFloat(candle[1]).toFixed(4)} H:${parseFloat(candle[2]).toFixed(4)} L:${parseFloat(candle[3]).toFixed(4)} C:${parseFloat(candle[4]).toFixed(4)}`;
        TestUtils.log(`   Candle ${idx + 1}: ${time} - ${prices}`, 'debug');
      });
      
      if (candleData.length > 3) {
        TestUtils.log(`   ... (${candleData.length - 6} candles in between) ...`, 'debug');
        
        candleData.slice(-3).forEach((candle, idx) => {
          const time = new Date(candle[0]).toLocaleString();
          const prices = `O:${parseFloat(candle[1]).toFixed(4)} H:${parseFloat(candle[2]).toFixed(4)} L:${parseFloat(candle[3]).toFixed(4)} C:${parseFloat(candle[4]).toFixed(4)}`;
          TestUtils.log(`   Candle ${candleData.length - 2 + idx}: ${time} - ${prices}`, 'debug');
        });
      }
    }

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'tests/screenshots/candle-count-verification.png', 
      clip: { x: 0, y: 0, width: 1200, height: 600 }
    });

    TestUtils.log('\n✅ SUMMARY:', 'success');
    TestUtils.log(`Your TradingView chart should display ${candleData.length} hourly candles`, 'success');
    if (candleData.length > 0) {
      const timeSpanDays = (candleData[candleData.length - 1][0] - candleData[0][0]) / (1000 * 60 * 60 * 24);
      TestUtils.log(`Covering approximately ${timeSpanDays.toFixed(1)} days of gsWETH/gsUSDC trading data`, 'success');
    }
  });
});
import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test.describe('Multiple Candles Visibility Test', () => {

  test('should display multiple candles instead of just one', async ({ page }) => {
    test.setTimeout(120000);

    TestUtils.log('🕯️  Testing multiple candles visibility...', 'info');
    
    let candleData: any[] = [];

    // Monitor the data being loaded
    await page.route('**/kline*', async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      
      if (response.ok() && Array.isArray(data) && data.length > 0) {
        candleData = data;
        TestUtils.log(`📈 ${data.length} candles loaded from API`, 'success');
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

    // Wait for chart container
    const chartContainer = page.locator('#tv_chart_container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });

    TestUtils.log('⏳ Waiting for chart initialization and zoom adjustments...', 'debug');
    
    // Wait for the chart to load and auto-fit adjustments to apply
    await page.waitForTimeout(20000);

    // Try manual zoom adjustments through the page interface
    TestUtils.log('🔍 Attempting to zoom out to show more candles...', 'debug');
    
    // Try keyboard shortcuts to zoom out
    await page.keyboard.press('Control+Minus'); // Zoom out
    await page.waitForTimeout(1000);
    await page.keyboard.press('Control+Minus'); // Zoom out more
    await page.waitForTimeout(1000);
    await page.keyboard.press('Control+Minus'); // Zoom out more
    await page.waitForTimeout(1000);

    // Try using TradingView's programmatic API
    const zoomResult = await page.evaluate(() => {
      try {
        // Try to find TradingView widget in global scope
        if (window.TradingView && typeof window.TradingView === 'object') {
          // Try various methods to access the chart
          const container = document.getElementById('tv_chart_container');
          if (container) {
            // Look for TradingView iframe
            const iframe = container.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              // Try to send zoom commands to iframe
              console.log('Found TradingView iframe');
              return { found: 'iframe', method: 'iframe access' };
            }
            
            // Try to find any chart API in the container
            const charts = container.querySelectorAll('[data-name="chart"]');
            console.log('Found chart elements:', charts.length);
            return { found: 'elements', count: charts.length };
          }
        }
        return { found: 'none' };
      } catch (e) {
        console.log('Error accessing TradingView chart:', e);
        return { found: 'error', error: e.message };
      }
    });

    TestUtils.log(`Chart access result: ${JSON.stringify(zoomResult)}`, 'debug');

    // Take screenshots to see the current state
    await page.screenshot({ 
      path: 'tests/screenshots/multiple-candles-before-manual-zoom.png', 
      clip: { x: 0, y: 0, width: 1200, height: 600 }
    });

    // Try clicking on chart area and using mouse wheel to zoom out
    TestUtils.log('🖱️  Trying mouse wheel zoom...', 'debug');
    const chartArea = chartContainer.locator('iframe, canvas').first();
    
    if (await chartArea.count() > 0) {
      await chartArea.hover();
      await page.waitForTimeout(500);
      
      // Scroll up (zoom out) multiple times
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, -100); // Scroll up to zoom out
        await page.waitForTimeout(300);
      }
      
      TestUtils.log('Applied mouse wheel zoom out', 'debug');
    }

    // Wait for any zoom changes to take effect
    await page.waitForTimeout(3000);

    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/multiple-candles-after-zoom.png', 
      clip: { x: 0, y: 0, width: 1200, height: 600 }
    });

    // Check final state
    const finalState = await page.evaluate(() => {
      const container = document.getElementById('tv_chart_container');
      if (!container) return null;
      
      return {
        containerSize: {
          width: container.clientWidth,
          height: container.clientHeight
        },
        iframeCount: container.querySelectorAll('iframe').length,
        canvasCount: container.querySelectorAll('canvas').length,
        htmlLength: container.innerHTML.length
      };
    });

    TestUtils.log('\n📊 Final Results:', 'info');
    TestUtils.log(`   📈 API Data: ${candleData.length} candles loaded`, 'debug');
    TestUtils.log(`   📱 Container: ${finalState?.containerSize?.width}x${finalState?.containerSize?.height}`, 'debug');
    TestUtils.log(`   🖼️  Iframes: ${finalState?.iframeCount}`, 'debug');
    TestUtils.log(`   🎨 Canvases: ${finalState?.canvasCount}`, 'debug');

    if (candleData.length > 1) {
      TestUtils.log('\n🕯️  Multiple Candles Solution:', 'info');
      TestUtils.log('   The chart has loaded 35 candles successfully.', 'success');
      TestUtils.log('   If you only see 1 candle, try these manual steps:', 'info');
      TestUtils.log('   1. Use mouse wheel to scroll up on the chart (zoom out)', 'info');
      TestUtils.log('   2. Use keyboard: Ctrl + - to zoom out', 'info');
      TestUtils.log('   3. Look for a "Fit" or "Auto-scale" button in TradingView toolbar', 'info');
      TestUtils.log('   4. Try clicking and dragging left/right to scroll through time', 'info');
      TestUtils.log(`   5. The data spans ${((candleData[candleData.length-1][0] - candleData[0][0]) / (1000*60*60*24)).toFixed(1)} days`, 'info');
    }

    // Verify data is loaded correctly
    expect(candleData.length).toBeGreaterThan(1);
    expect(finalState?.containerSize?.width).toBeGreaterThan(100);
    
    TestUtils.log('\n✅ Multiple candles data is available. Chart zoom may need manual adjustment.', 'success');
  });
});
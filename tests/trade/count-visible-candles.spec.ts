import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test.describe('Count Actual Visible Candles', () => {

  test('should count how many candlesticks are actually visible on the chart', async ({ page }) => {
    test.setTimeout(90000);

    TestUtils.log('🔍 COUNTING ACTUAL VISIBLE CANDLESTICKS...', 'info');
    
    let apiCandleCount = 0;

    // Monitor API data
    await page.route('**/kline*', async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      
      if (response.ok() && Array.isArray(data) && data.length > 0) {
        apiCandleCount = data.length;
        TestUtils.log(`📊 API returned ${data.length} candles`, 'success');
        
        // Log first few candles for verification
        data.slice(0, 3).forEach((candle, idx) => {
          TestUtils.log(`   Candle ${idx + 1}: O:${candle[1]} H:${candle[2]} L:${candle[3]} C:${candle[4]}`, 'debug');
        });
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

    TestUtils.log('⏳ Waiting for chart to load and stabilize...', 'debug');
    await page.waitForTimeout(20000);

    // Close any settings dialogs that might be open
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } catch (e) {
      // Ignore if no dialog to close
    }

    // Take a clean screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/candle-count-verification.png', 
      clip: { x: 0, y: 0, width: 1400, height: 800 }
    });

    // Analyze the chart content in detail
    const chartAnalysis = await page.evaluate(() => {
      const container = document.getElementById('tv_chart_container');
      if (!container) return null;
      
      // Look for TradingView iframe content
      const iframes = container.querySelectorAll('iframe');
      let iframeAnalysis = { count: iframes.length, details: [] };
      
      for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i];
        try {
          // Try to access iframe content (may be blocked by CORS)
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            // Look for canvas elements which typically contain chart graphics
            const canvases = iframeDoc.querySelectorAll('canvas');
            const chartElements = iframeDoc.querySelectorAll('[class*="chart"], [class*="candle"], [class*="bar"]');
            
            iframeAnalysis.details.push({
              index: i,
              canvases: canvases.length,
              chartElements: chartElements.length,
              bodyClasses: iframeDoc.body ? iframeDoc.body.className : 'no-body'
            });
          }
        } catch (e) {
          iframeAnalysis.details.push({
            index: i,
            error: 'CORS_BLOCKED',
            src: iframe.src?.substring(0, 100) || 'no-src'
          });
        }
      }
      
      // Check main container for any visual indicators
      const containerAnalysis = {
        width: container.clientWidth,
        height: container.clientHeight,
        innerHTML: container.innerHTML.substring(0, 500), // First 500 chars
        hasVisibleContent: container.innerHTML.length > 2000,
        directCanvases: container.querySelectorAll('canvas').length,
        directSvgs: container.querySelectorAll('svg').length
      };
      
      return {
        iframe: iframeAnalysis,
        container: containerAnalysis
      };
    });

    // Try to detect chart state through DOM inspection
    const chartState = await page.evaluate(() => {
      // Look for any elements that might indicate chart rendering
      const possibleChartElements = document.querySelectorAll(
        'canvas, svg, [class*="chart"], [class*="trading"], [class*="candle"], [class*="ohlc"]'
      );
      
      const elements = Array.from(possibleChartElements).map(el => ({
        tagName: el.tagName,
        className: el.className?.substring(0, 50) || '',
        id: el.id || '',
        visible: el.offsetWidth > 0 && el.offsetHeight > 0,
        dimensions: {
          width: el.offsetWidth,
          height: el.offsetHeight
        }
      }));
      
      return {
        totalElements: possibleChartElements.length,
        elements: elements.slice(0, 10) // First 10 elements
      };
    });

    TestUtils.log('\\n🔍 VISUAL VERIFICATION RESULTS:', 'info');
    TestUtils.log('=' * 50, 'info');
    
    TestUtils.log('\\n📊 API DATA:', 'info');
    TestUtils.log(`   💾 Candles from API: ${apiCandleCount}`, 'debug');
    
    TestUtils.log('\\n🖼️  CHART CONTAINER ANALYSIS:', 'info');
    TestUtils.log(`   📱 Container Size: ${chartAnalysis?.container.width}x${chartAnalysis?.container.height}`, 'debug');
    TestUtils.log(`   🎭 IFrames Found: ${chartAnalysis?.iframe.count}`, 'debug');
    TestUtils.log(`   🎨 Direct Canvases: ${chartAnalysis?.container.directCanvases}`, 'debug');
    TestUtils.log(`   📄 Has Content: ${chartAnalysis?.container.hasVisibleContent}`, 'debug');

    if (chartAnalysis?.iframe.details) {
      TestUtils.log('\\n🔍 IFRAME ANALYSIS:', 'debug');
      chartAnalysis.iframe.details.forEach((detail, idx) => {
        if (detail.error) {
          TestUtils.log(`   IFrame ${idx}: ${detail.error} - ${detail.src}`, 'debug');
        } else {
          TestUtils.log(`   IFrame ${idx}: ${detail.canvases} canvases, ${detail.chartElements} chart elements`, 'debug');
        }
      });
    }

    TestUtils.log('\\n🎯 CHART ELEMENTS FOUND:', 'info');
    TestUtils.log(`   📊 Total Chart-like Elements: ${chartState.totalElements}`, 'debug');
    
    if (chartState.elements.length > 0) {
      chartState.elements.forEach((el, idx) => {
        TestUtils.log(`   Element ${idx + 1}: ${el.tagName} (${el.dimensions.width}x${el.dimensions.height}) - ${el.className}`, 'debug');
      });
    }

    TestUtils.log('\\n🎯 HONEST ASSESSMENT:', 'info');
    
    if (apiCandleCount > 1) {
      TestUtils.log(`✅ DATA: ${apiCandleCount} candles loaded from API`, 'success');
    } else {
      TestUtils.log(`❌ DATA: Only ${apiCandleCount} candle(s) from API`, 'error');
    }

    if (chartAnalysis?.container.hasVisibleContent && chartAnalysis?.iframe.count > 0) {
      TestUtils.log(`✅ DISPLAY: Chart container has substantial content with ${chartAnalysis.iframe.count} iframe(s)`, 'success');
    } else {
      TestUtils.log(`⚠️  DISPLAY: Chart content may not be fully rendered`, 'warning');
    }

    TestUtils.log('\\n❓ WHAT I CAN ACTUALLY VERIFY:', 'info');
    TestUtils.log(`• API provided ${apiCandleCount} data points`, 'info');
    TestUtils.log(`• Chart container is ${chartAnalysis?.container.width}x${chartAnalysis?.container.height} pixels`, 'info');
    TestUtils.log(`• Found ${chartAnalysis?.iframe.count} iframe(s) for TradingView`, 'info');
    TestUtils.log(`• Cannot directly count visible candlesticks due to iframe CORS restrictions`, 'warning');
    
    TestUtils.log('\\n❓ WHAT I CANNOT VERIFY:', 'warning');
    TestUtils.log(`• Exact number of visible candlesticks on screen`, 'warning');
    TestUtils.log(`• Whether data is displayed as candles vs lines`, 'warning');
    TestUtils.log(`• Current zoom level showing multiple vs single candle`, 'warning');

    TestUtils.log('\\n💡 TO MANUALLY VERIFY:', 'info');
    TestUtils.log(`• Look at the screenshot: candle-count-verification.png`, 'info');
    TestUtils.log(`• Count visible green/red rectangular candle shapes`, 'info');
    TestUtils.log(`• Check if you see multiple time periods on X-axis`, 'info');
    TestUtils.log(`• Verify price movements across the chart width`, 'info');

    // Basic assertions we can make
    expect(apiCandleCount).toBeGreaterThan(0);
    expect(chartAnalysis?.container.width).toBeGreaterThan(100);
    expect(chartAnalysis?.iframe.count).toBeGreaterThan(0);

    TestUtils.log(`\\n📸 Screenshot saved for manual verification`, 'success');
  });
});
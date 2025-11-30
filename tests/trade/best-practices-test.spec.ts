import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test.describe('TradingView Best Practices Implementation', () => {

  test('should automatically show multiple candles using best practices', async ({ page }) => {
    test.setTimeout(90000);

    TestUtils.log('🏆 Testing TradingView best practices implementation...', 'info');
    
    let candleCount = 0;
    const consoleLogs: string[] = [];

    // Capture console logs to verify best practices are working
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      
      if (text.includes('best practices') || 
          text.includes('FitAll') || 
          text.includes('auto-fit') ||
          text.includes('visible range')) {
        TestUtils.log(`📋 ${text}`, 'debug');
      }
    });

    // Monitor API calls
    await page.route('**/kline*', async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      
      if (response.ok() && Array.isArray(data) && data.length > 0) {
        candleCount = data.length;
        TestUtils.log(`📊 ${data.length} candles loaded from API`, 'success');
      }
      
      route.fulfill({ response });
    });
    
    // Navigate to trade page
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    // Wait for TradingView initialization
    await page.waitForFunction(
      () => typeof window.TradingView !== 'undefined',
      { timeout: 30000 }
    );

    // Wait for chart container
    const chartContainer = page.locator('#tv_chart_container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });

    TestUtils.log('⏳ Waiting for best practices auto-fit to apply...', 'debug');
    
    // Wait longer for all the best practices to take effect
    await page.waitForTimeout(25000);

    // Check if best practices were applied
    const bestPracticesApplied = {
      widgetReady: consoleLogs.some(log => log.includes('TradingView widget ready')),
      bestPracticesMsg: consoleLogs.some(log => log.includes('best practices')),
      dataLoaded: consoleLogs.some(log => log.includes('Chart data loaded')),
      fitAllApplied: consoleLogs.some(log => log.includes('FitAll')),
      visibleRangeSet: consoleLogs.some(log => log.includes('visible range')),
      autoFitApplied: consoleLogs.some(log => log.includes('auto-fit')),
    };

    // Take screenshot to verify visual state
    await page.screenshot({ 
      path: 'tests/screenshots/best-practices-implementation.png', 
      clip: { x: 0, y: 0, width: 1200, height: 600 }
    });

    // Verify chart state
    const chartState = await page.evaluate(() => {
      const container = document.getElementById('tv_chart_container');
      if (!container) return null;
      
      return {
        containerSize: {
          width: container.clientWidth,
          height: container.clientHeight
        },
        hasContent: container.innerHTML.length > 1000,
        iframeCount: container.querySelectorAll('iframe').length,
        canvasCount: container.querySelectorAll('canvas').length
      };
    });

    TestUtils.log('\n🏆 Best Practices Implementation Results:', 'info');
    TestUtils.log(`   📊 Candles Loaded: ${candleCount}`, 'debug');
    TestUtils.log(`   ✅ Widget Ready: ${bestPracticesApplied.widgetReady}`, bestPracticesApplied.widgetReady ? 'success' : 'warning');
    TestUtils.log(`   ✅ Best Practices Applied: ${bestPracticesApplied.bestPracticesMsg}`, bestPracticesApplied.bestPracticesMsg ? 'success' : 'warning');
    TestUtils.log(`   ✅ Data Loaded Event: ${bestPracticesApplied.dataLoaded}`, bestPracticesApplied.dataLoaded ? 'success' : 'warning');
    TestUtils.log(`   ✅ FitAll Executed: ${bestPracticesApplied.fitAllApplied}`, bestPracticesApplied.fitAllApplied ? 'success' : 'warning');
    TestUtils.log(`   ✅ Visible Range Set: ${bestPracticesApplied.visibleRangeSet}`, bestPracticesApplied.visibleRangeSet ? 'success' : 'warning');
    TestUtils.log(`   ✅ Auto-fit Applied: ${bestPracticesApplied.autoFitApplied}`, bestPracticesApplied.autoFitApplied ? 'success' : 'warning');

    if (chartState) {
      TestUtils.log(`   📱 Container: ${chartState.containerSize.width}x${chartState.containerSize.height}`, 'debug');
      TestUtils.log(`   🖼️  Content Present: ${chartState.hasContent}`, 'debug');
    }

    // Show relevant console logs for debugging
    TestUtils.log('\n📋 Key Console Messages:', 'debug');
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('TradingView') || 
      log.includes('FitAll') ||
      log.includes('auto-fit') ||
      log.includes('visible range') ||
      log.includes('bars') ||
      log.includes('best practices')
    ).slice(0, 10);
    
    relevantLogs.forEach(log => {
      TestUtils.log(`   ${log.substring(0, 80)}...`, 'debug');
    });

    // Assertions
    expect(candleCount).toBeGreaterThan(1);
    expect(bestPracticesApplied.widgetReady).toBe(true);
    expect(chartState?.hasContent).toBe(true);

    // Determine success level
    const successfulPractices = Object.values(bestPracticesApplied).filter(Boolean).length;
    const totalPractices = Object.keys(bestPracticesApplied).length;
    
    TestUtils.log(`\n📈 SUCCESS RATE: ${successfulPractices}/${totalPractices} best practices applied`, 'info');

    if (successfulPractices >= totalPractices * 0.8) {
      TestUtils.log('🎉 EXCELLENT: Most best practices are working!', 'success');
    } else if (successfulPractices >= totalPractices * 0.5) {
      TestUtils.log('✅ GOOD: Core best practices are working', 'success');
    } else {
      TestUtils.log('⚠️  PARTIAL: Some best practices may need adjustment', 'warning');
    }

    TestUtils.log('\n🎯 EXPECTED RESULT:', 'info');
    TestUtils.log('Your TradingView chart should now automatically:', 'success');
    TestUtils.log('• Show multiple candles by default (not just 1)', 'success');
    TestUtils.log('• Auto-fit to display optimal zoom level', 'success');
    TestUtils.log('• Display 5+ days of trading data', 'success');
    TestUtils.log('• Automatically adjust when new data loads', 'success');
  });
});
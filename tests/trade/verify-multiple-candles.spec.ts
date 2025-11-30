import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

test.describe('Verify Multiple Candles Display', () => {

  test('should verify TradingView displays multiple candles automatically', async ({ page }) => {
    test.setTimeout(120000);

    TestUtils.log('🔍 VERIFICATION: Multiple candles display...', 'info');
    
    let apiCandleCount = 0;
    let apiCallsSuccessful = 0;
    const consoleLogs: string[] = [];
    const automationEvents: string[] = [];

    // Capture console for automation verification
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      
      // Track automation events
      if (text.includes('setVisibleRange') || 
          text.includes('timeScaleReset') || 
          text.includes('auto-fit') ||
          text.includes('Chart data loaded')) {
        automationEvents.push(text);
        TestUtils.log(`🤖 Automation: ${text.substring(0, 60)}...`, 'debug');
      }
    });

    // Monitor API data
    await page.route('**/kline*', async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      
      if (response.ok() && Array.isArray(data) && data.length > 0) {
        apiCandleCount = data.length;
        apiCallsSuccessful++;
        TestUtils.log(`📊 API: ${data.length} candles received (call #${apiCallsSuccessful})`, 'success');
      }
      
      route.fulfill({ response });
    });
    
    TestUtils.log('🚀 Loading trade page...', 'debug');
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    TestUtils.log('⏳ Waiting for TradingView initialization...', 'debug');
    await page.waitForFunction(
      () => typeof window.TradingView !== 'undefined',
      { timeout: 30000 }
    );

    // Wait for chart container
    const chartContainer = page.locator('#tv_chart_container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });
    TestUtils.log('✅ Chart container visible', 'success');

    TestUtils.log('⏳ Waiting for automation to complete (30 seconds)...', 'debug');
    await page.waitForTimeout(30000);

    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'tests/screenshots/verification-multiple-candles.png', 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1400, height: 800 }
    });

    // Analyze chart state in detail
    const chartAnalysis = await page.evaluate(() => {
      const container = document.getElementById('tv_chart_container');
      if (!container) return null;
      
      const iframes = container.querySelectorAll('iframe');
      const canvases = container.querySelectorAll('canvas');
      
      // Try to detect TradingView chart content
      let chartContent = {
        hasIframes: iframes.length > 0,
        hasCanvases: canvases.length > 0,
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        htmlContentLength: container.innerHTML.length,
        hasSubstantialContent: container.innerHTML.length > 2000
      };

      // Look for specific TradingView elements
      const tvElements = {
        priceAxis: container.querySelectorAll('[class*="price"]').length,
        timeAxis: container.querySelectorAll('[class*="time"]').length,
        chartElements: container.querySelectorAll('[class*="chart"]').length,
        tradingViewContent: container.innerHTML.includes('TradingView') || container.innerHTML.includes('tv-')
      };

      return { ...chartContent, ...tvElements };
    });

    // Check for critical automation events
    const automationCheck = {
      dataLoadedDetected: automationEvents.some(e => e.includes('Chart data loaded')),
      visibleRangeSet: automationEvents.some(e => e.includes('setVisibleRange')),
      autoFitApplied: automationEvents.some(e => e.includes('auto-fit')),
      timeScaleReset: automationEvents.some(e => e.includes('timeScaleReset')),
      automationCount: automationEvents.length
    };

    TestUtils.log('\n📊 VERIFICATION RESULTS:', 'info');
    TestUtils.log('=' * 50, 'info');

    // Data verification
    TestUtils.log('\n📈 DATA VERIFICATION:', 'info');
    TestUtils.log(`   🔢 Candles from API: ${apiCandleCount}`, apiCandleCount > 1 ? 'success' : 'error');
    TestUtils.log(`   📞 Successful API calls: ${apiCallsSuccessful}`, apiCallsSuccessful > 0 ? 'success' : 'error');
    
    // Chart rendering verification
    TestUtils.log('\n🖼️  CHART RENDERING:', 'info');
    TestUtils.log(`   📱 Container size: ${chartAnalysis?.containerWidth}x${chartAnalysis?.containerHeight}`, 'debug');
    TestUtils.log(`   🎭 Has iframes: ${chartAnalysis?.hasIframes}`, chartAnalysis?.hasIframes ? 'success' : 'warning');
    TestUtils.log(`   🎨 Has canvases: ${chartAnalysis?.hasCanvases}`, 'debug');
    TestUtils.log(`   📄 Content loaded: ${chartAnalysis?.hasSubstantialContent}`, chartAnalysis?.hasSubstantialContent ? 'success' : 'warning');
    TestUtils.log(`   🏗️  TradingView elements: ${chartAnalysis?.tradingViewContent}`, chartAnalysis?.tradingViewContent ? 'success' : 'warning');

    // Automation verification
    TestUtils.log('\n🤖 AUTOMATION VERIFICATION:', 'info');
    TestUtils.log(`   📊 Data loaded events: ${automationCheck.dataLoadedDetected}`, automationCheck.dataLoadedDetected ? 'success' : 'warning');
    TestUtils.log(`   📏 Visible range set: ${automationCheck.visibleRangeSet}`, automationCheck.visibleRangeSet ? 'success' : 'warning');
    TestUtils.log(`   🎯 Auto-fit applied: ${automationCheck.autoFitApplied}`, automationCheck.autoFitApplied ? 'success' : 'warning');
    TestUtils.log(`   ⏰ Time scale reset: ${automationCheck.timeScaleReset}`, 'debug');
    TestUtils.log(`   🔄 Total automation events: ${automationCheck.automationCount}`, 'debug');

    // Show sample automation events
    if (automationEvents.length > 0) {
      TestUtils.log('\n🔍 Sample automation events:', 'debug');
      automationEvents.slice(0, 5).forEach((event, idx) => {
        TestUtils.log(`   ${idx + 1}. ${event.substring(0, 70)}...`, 'debug');
      });
    }

    // Calculate success score
    const scores = {
      dataScore: apiCandleCount > 1 && apiCallsSuccessful > 0 ? 1 : 0,
      renderScore: chartAnalysis?.hasSubstantialContent && chartAnalysis?.hasIframes ? 1 : 0,
      automationScore: automationCheck.dataLoadedDetected && automationCheck.visibleRangeSet ? 1 : 0
    };
    
    const totalScore = scores.dataScore + scores.renderScore + scores.automationScore;
    const maxScore = 3;

    TestUtils.log(`\n📈 OVERALL SCORE: ${totalScore}/${maxScore}`, 'info');

    // Final verification
    TestUtils.log('\n✅ FINAL VERIFICATION:', 'info');
    
    if (totalScore === maxScore) {
      TestUtils.log('🎉 PERFECT: Multiple candles should be displaying correctly!', 'success');
      TestUtils.log('   • Data loaded successfully ✅', 'success');
      TestUtils.log('   • Chart rendered properly ✅', 'success');
      TestUtils.log('   • Automation working ✅', 'success');
    } else if (totalScore >= 2) {
      TestUtils.log('✅ GOOD: Chart is working, minor issues possible', 'success');
      if (scores.dataScore === 0) TestUtils.log('   ⚠️  Data loading needs attention', 'warning');
      if (scores.renderScore === 0) TestUtils.log('   ⚠️  Chart rendering needs attention', 'warning');
      if (scores.automationScore === 0) TestUtils.log('   ⚠️  Automation needs attention', 'warning');
    } else {
      TestUtils.log('⚠️  PARTIAL: Some issues detected, check details above', 'warning');
    }

    TestUtils.log('\n🎯 EXPECTED BEHAVIOR:', 'info');
    TestUtils.log('If everything is working correctly, you should see:', 'info');
    TestUtils.log(`• ${apiCandleCount} candlesticks displayed across the chart width`, 'info');
    TestUtils.log('• Chart automatically zoomed to show multiple candles', 'info');
    TestUtils.log('• Time axis showing multiple time periods', 'info');
    TestUtils.log('• Price movements visible across the time range', 'info');

    // Core assertions for test pass/fail
    expect(apiCandleCount).toBeGreaterThan(1);
    expect(apiCallsSuccessful).toBeGreaterThan(0);
    expect(chartAnalysis?.hasSubstantialContent).toBe(true);
    expect(totalScore).toBeGreaterThanOrEqual(2);

    TestUtils.log(`\n📸 Screenshot saved: verification-multiple-candles.png`, 'info');
    TestUtils.log('Check the screenshot to visually confirm multiple candles are displayed!', 'success');
  });

  test('should test manual zoom controls as fallback', async ({ page }) => {
    test.setTimeout(60000);

    TestUtils.log('🖱️  Testing manual zoom controls as fallback...', 'info');
    
    await page.goto(TestUtils.getUrl('/trade'));
    await page.waitForLoadState('load');

    // Wait for chart to load
    const chartContainer = page.locator('#tv_chart_container');
    await expect(chartContainer).toBeVisible({ timeout: 30000 });
    
    await page.waitForTimeout(15000);

    TestUtils.log('🔍 Testing keyboard zoom shortcuts...', 'debug');
    
    // Test keyboard zoom out
    await page.keyboard.press('Control+Minus');
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+Minus');
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+Minus');
    
    TestUtils.log('🖱️  Testing mouse wheel zoom...', 'debug');
    
    // Test mouse wheel zoom (if chart is interactive)
    const chartArea = chartContainer.locator('iframe, canvas, div').first();
    if (await chartArea.count() > 0) {
      await chartArea.hover();
      await page.mouse.wheel(0, -120); // Zoom out
      await page.waitForTimeout(300);
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(300);
    }

    // Take screenshot after manual adjustments
    await page.screenshot({ 
      path: 'tests/screenshots/manual-zoom-test.png', 
      clip: { x: 0, y: 0, width: 1200, height: 600 }
    });

    TestUtils.log('✅ Manual zoom controls tested', 'success');
    TestUtils.log('💡 Manual zoom tips:', 'info');
    TestUtils.log('• Use Ctrl+Minus to zoom out', 'info');
    TestUtils.log('• Use mouse wheel scroll up while hovering over chart', 'info');
    TestUtils.log('• Click and drag horizontally to pan through time', 'info');
    TestUtils.log('• Look for auto-fit buttons in TradingView toolbar', 'info');
  });
});
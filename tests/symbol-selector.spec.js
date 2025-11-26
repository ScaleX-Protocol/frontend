const { test, expect } = require('@playwright/test');

test.describe('Symbol Selector', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to trade page
    await page.goto('http://localhost:3001/trade');
    await page.waitForLoadState('load');
    // Wait for markets data to load
    await page.waitForTimeout(2000);
  });

  test('displays symbol selector button', async ({ page }) => {
    // Check if symbol selector button exists
    const selectorButton = page.getByTestId('symbol-selector-button');
    await expect(selectorButton).toBeVisible();
    
    // Check if it shows a trading pair
    const buttonText = await selectorButton.textContent();
    expect(buttonText).toMatch(/gs[A-Z]+\/gs[A-Z]+/); // Should match pattern like gsWBTC/gsUSDC
  });

  test('opens dropdown when clicked', async ({ page }) => {
    const selectorButton = page.getByTestId('symbol-selector-button');
    
    // Click to open dropdown
    await selectorButton.click();
    
    // Check if dropdown options are visible
    const wbtcOption = page.getByTestId('symbol-option-gsWBTCgsUSDC');
    const wethOption = page.getByTestId('symbol-option-gsWETHgsUSDC');
    
    await expect(wbtcOption).toBeVisible();
    await expect(wethOption).toBeVisible();
  });

  test('can switch between symbols', async ({ page }) => {
    const selectorButton = page.getByTestId('symbol-selector-button');
    
    // Get initial symbol
    const initialText = await selectorButton.textContent();
    
    // Open dropdown
    await selectorButton.click();
    
    // Click on different symbol option
    const wethOption = page.getByTestId('symbol-option-gsWETHgsUSDC');
    await wethOption.click();
    
    // Wait for the change to take effect
    await page.waitForTimeout(500);
    
    // Check that button text has changed
    const newText = await selectorButton.textContent();
    expect(newText).not.toBe(initialText);
    expect(newText).toContain('gsWETH/gsUSDC');
  });

  test('updates trading interface when symbol changes', async ({ page }) => {
    const selectorButton = page.getByTestId('symbol-selector-button');
    
    // Open dropdown and switch to WETH
    await selectorButton.click();
    const wethOption = page.getByTestId('symbol-option-gsWETHgsUSDC');
    await wethOption.click();
    
    // Wait for UI updates
    await page.waitForTimeout(1000);
    
    // Check that place order section shows the new symbol
    const placeOrderSection = page.locator('text=Trading: gsWETH/gsUSDC');
    await expect(placeOrderSection).toBeVisible();
  });

  test('displays market stats for selected symbol', async ({ page }) => {
    // Check if volume and liquidity stats are displayed
    const volumeSection = page.locator('text=24h Volume').locator('..');
    const liquiditySection = page.locator('text=Liquidity').locator('..');
    
    await expect(volumeSection).toBeVisible();
    await expect(liquiditySection).toBeVisible();
  });

  test('closes dropdown when clicking outside', async ({ page }) => {
    const selectorButton = page.getByTestId('symbol-selector-button');
    
    // Open dropdown
    await selectorButton.click();
    
    // Verify dropdown is open
    const wbtcOption = page.getByTestId('symbol-option-gsWBTCgsUSDC');
    await expect(wbtcOption).toBeVisible();
    
    // Click outside the dropdown
    await page.click('body', { position: { x: 100, y: 100 } });
    
    // Wait a moment for the dropdown to close
    await page.waitForTimeout(300);
    
    // Verify dropdown is closed
    await expect(wbtcOption).not.toBeVisible();
  });

  test('symbol change triggers API calls for new data', async ({ page }) => {
    let klineRequests = [];
    let orderRequests = [];
    let tradeRequests = [];
    
    // Listen for API requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/indexer/kline')) {
        klineRequests.push(url);
      } else if (url.includes('/indexer/allOrders')) {
        orderRequests.push(url);
      } else if (url.includes('/indexer/trades')) {
        tradeRequests.push(url);
      }
    });
    
    const selectorButton = page.getByTestId('symbol-selector-button');
    
    // Switch symbol
    await selectorButton.click();
    const wethOption = page.getByTestId('symbol-option-gsWETHgsUSDC');
    await wethOption.click();
    
    // Wait for API calls
    await page.waitForTimeout(2000);
    
    // Verify that new API calls were made with the correct symbol
    const recentKlineRequest = klineRequests[klineRequests.length - 1];
    expect(recentKlineRequest).toContain('gsWETH/gsUSDC');
  });

  test('displays loading state appropriately', async ({ page }) => {
    // Check that loading states are handled properly
    const loadingElement = page.locator('text=Loading markets...');
    const errorElement = page.locator('text=Error loading market data');
    const noDataElement = page.locator('text=No market data available');
    
    // At least one of these states should have appeared during load
    // (they might not be visible anymore after data loads)
    const hasAppropriateStates = await Promise.race([
      page.getByTestId('symbol-selector-button').isVisible(),
      loadingElement.isVisible(),
      errorElement.isVisible(),
      noDataElement.isVisible()
    ]);
    
    expect(hasAppropriateStates).toBeTruthy();
  });

  test('symbol selector is accessible', async ({ page }) => {
    const selectorButton = page.getByTestId('symbol-selector-button');
    
    // Test keyboard navigation
    await selectorButton.focus();
    await expect(selectorButton).toBeFocused();
    
    // Open with Enter key
    await page.keyboard.press('Enter');
    
    const wbtcOption = page.getByTestId('symbol-option-gsWBTCgsUSDC');
    await expect(wbtcOption).toBeVisible();
    
    // Close with Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(wbtcOption).not.toBeVisible();
  });
});
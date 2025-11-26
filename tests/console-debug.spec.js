const { test } = require('@playwright/test');

test('Check console logs during symbol switch', async ({ page }) => {
  const consoleLogs = [];
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'log') {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('🖥️ ', text);
    }
  });

  console.log('🚀 Navigating to trade page...');
  await page.goto('http://localhost:3001/trade');
  await page.waitForLoadState('load');
  
  console.log('⏳ Waiting for initial load...');
  await page.waitForTimeout(3000);
  
  console.log('\n📋 Initial console logs:');
  consoleLogs.forEach(log => console.log('  ', log));
  consoleLogs.length = 0; // Clear for symbol switch
  
  // Find symbol selector and switch
  const symbolSelector = page.locator('[data-testid="symbol-selector-button"]');
  const selectorExists = await symbolSelector.count() > 0;
  
  if (selectorExists) {
    const initialSymbol = await symbolSelector.textContent();
    console.log('\n🎯 Current symbol:', initialSymbol);
    
    console.log('🔄 Clicking symbol selector...');
    await symbolSelector.click();
    await page.waitForTimeout(1000);
    
    const options = page.locator('[data-testid^="symbol-option-"]');
    const optionCount = await options.count();
    
    if (optionCount > 1) {
      console.log('🎯 Clicking second option...');
      await options.nth(1).click();
      
      console.log('⏳ Waiting for state changes...');
      await page.waitForTimeout(3000);
      
      const newSymbol = await symbolSelector.textContent();
      console.log('🆕 New symbol:', newSymbol);
      
      console.log('\n📋 Console logs after symbol switch:');
      consoleLogs.forEach(log => console.log('  ', log));
      
      const symbolChangeLogs = consoleLogs.filter(log => 
        log.includes('symbol') || log.includes('Symbol') || log.includes('Trade component') || log.includes('useKline')
      );
      
      console.log('\n🔍 Symbol-related logs:');
      symbolChangeLogs.forEach(log => console.log('  ', log));
      
      if (symbolChangeLogs.length === 0) {
        console.log('❌ No symbol-related console logs found!');
      }
    }
  } else {
    console.log('❌ Symbol selector not found');
  }
});
const { exec } = require('child_process');
const playwright = require('playwright');

(async () => {
  console.log('🧪 Testing with Rabby Wallet - Opening Chrome with your profile\n');

  // Try to find Chrome user data directory
  const possiblePaths = [
    '/Users/renakaagusta/Library/Application Support/Google/Chrome',
    '/Users/renakaagusta/Library/Application Support/Chromium',
  ];

  console.log('📋 INSTRUCTIONS:');
  console.log('   1. A Chrome window will open with your existing profile');
  console.log('   2. Go to https://base-sepolia-app.scalex.money');
  console.log('   3. Log in using your Rabby wallet');
  console.log('   4. Check the console logs (F12 → Console)');
  console.log('   5. Look for [useWalletState] and [Home] logs');
  console.log('   6. Share the output here\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Open Chrome with extensions enabled
  const chromeCommand = `open -a "Google Chrome" --args --disable-blink-features=AutomationControlled https://base-sepolia-app.scalex.money`;

  console.log('Opening Chrome with your profile and extensions...\n');

  exec(chromeCommand, (error) => {
    if (error) {
      console.error('❌ Failed to open Chrome:', error.message);
      console.log('\nAlternatively, you can:');
      console.log('1. Open Chrome normally');
      console.log('2. Go to: https://base-sepolia-app.scalex.money');
      console.log('3. Open DevTools (F12 or Cmd+Option+I)');
      console.log('4. Go to Console tab');
      console.log('5. Log in with Rabby wallet');
      console.log('6. Look for these logs:');
      console.log('   - [useWalletState] Wallets: ...');
      console.log('   - [useWalletState] Embedded wallet found: ...');
      console.log('   - [Home] Wallet address: ...');
      console.log('   - [Home] Enabled condition: ...');
      console.log('   - [Home] Lending data: ...');
      console.log('\n7. Share those log lines with me!');
      return;
    }

    console.log('✅ Chrome opened successfully!');
    console.log('\nWhat to look for in the Console:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n1. [useWalletState] Wallets:');
    console.log('   - Shows all available wallets');
    console.log('   - Should show if Rabby/embedded wallet is detected\n');

    console.log('2. [useWalletState] Embedded wallet found:');
    console.log('   - Should show wallet address OR "NOT FOUND"\n');

    console.log('3. [Home] Wallet address:');
    console.log('   - Should show your actual address (0x...)');
    console.log('   - Currently shows "Not Created" (the problem!)\n');

    console.log('4. [Home] Enabled condition:');
    console.log('   - Should be "true" when logged in');
    console.log('   - Currently "false" (blocking API calls)\n');

    console.log('5. [Home] Lending data:');
    console.log('   - Shows if API was called and what data returned\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nPlease share these log lines after logging in!');
  });
})();

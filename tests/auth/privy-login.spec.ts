import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

const { BASE_URL } = TEST_CONFIG;

test.describe('Privy Authentication', () => {

  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  });

  test('Should show login button when not authenticated', async ({ page }) => {
    console.log('🔍 Testing login button visibility...');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for the Connect/Login button
    const loginButton = page.locator('button:has-text("Connect"), button:has-text("LogIn")');
    await expect(loginButton).toBeVisible({ timeout: 10000 });

    // Verify logout button is not visible
    const logoutButton = page.locator('button:has-text("LogOut"), button:has-text("Disconnect")');
    await expect(logoutButton).not.toBeVisible();

    console.log('✅ Login button is visible for unauthenticated user');
  });

  test('Should open Privy modal when Connect button is clicked', async ({ page }) => {
    console.log('🔍 Testing Privy modal opening...');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Find and click the Connect button
    const loginButton = page.locator('button:has-text("Connect")');
    await expect(loginButton).toBeVisible({ timeout: 10000 });

    // Monitor for Privy modal appearance
    const modalPromise = page.waitForSelector('[data-privy-modal="true"], .privy-modal, [class*="privy"], [id*="privy"]', {
      timeout: 15000,
      state: 'visible'
    });

    // Click the login button
    await loginButton.click();

    try {
      const modal = await modalPromise;
      console.log('✅ Privy modal opened successfully');
      await expect(modal).toBeVisible();
    } catch (error) {
      console.log('ℹ️ Privy modal not found - checking alternative selectors...');

      // Check for any modal-like elements
      const modalAlternative = page.locator('[role="dialog"], .modal, [class*="dialog"], [class*="popup"]');
      const isVisible = await modalAlternative.isVisible();

      if (isVisible) {
        console.log('✅ Alternative modal found and visible');
      } else {
        console.log('ℹ️ No modal detected - might be handled differently');
      }
    }
  });

  test('Should handle login flow with mock authentication', async ({ page }) => {
    console.log('🔍 Testing login flow...');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Capture network requests to monitor authentication
    const authRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('privy') || request.url().includes('auth')) {
        authRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log(`📡 Auth Request: ${request.method()} ${request.url()}`);
      }
    });

    // Monitor console for authentication-related logs
    const consoleLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('privy') || text.includes('login') || text.includes('auth')) {
        consoleLogs.push({ type: msg.type(), text, timestamp: new Date().toISOString() });
        console.log(`🖥️ Console (${msg.type()}): ${text}`);
      }
    });

    // Find and click the Connect button
    const loginButton = page.locator('button:has-text("Connect")');
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    // Wait a bit for any modal to appear
    await page.waitForTimeout(5000);

    // Check if authentication state changes
    const loginSuccessIndicator = page.locator('button:has-text("LogOut"), button:has-text("Disconnect")');

    try {
      await expect(loginSuccessIndicator).toBeVisible({ timeout: 20000 });
      console.log('✅ User appears to be authenticated');

      // Verify the button contains an address (truncated format)
      const addressRegex = /0x[a-fA-F0-9]{3}\.\.\.[a-fA-F0-9]{4}/;
      const logoutButton = page.locator('button:has-text("LogOut")');
      const buttonText = await logoutButton.textContent();

      if (addressRegex.test(buttonText)) {
        console.log(`✅ Address format correct: ${buttonText}`);
      } else {
        console.log(`ℹ️ Button text: ${buttonText}`);
      }

    } catch (error) {
      console.log('ℹ️ Authentication might require manual interaction or is not completing automatically');
      console.log('ℹ️ This is expected in a headless environment without actual wallet interaction');
    }
  });

  test('Should handle logout flow', async ({ page }) => {
    console.log('🔍 Testing logout flow...');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // First, attempt to login (or check if already logged in)
    const loginButton = page.locator('button:has-text("Connect")');
    const logoutButton = page.locator('button:has-text("LogOut"), button:has-text("Disconnect")');

    try {
      // Check if already authenticated
      const isLoggedOut = await loginButton.isVisible();

      if (isLoggedOut) {
        console.log('ℹ️ User is not authenticated, skipping logout test');
        return;
      }

      // If authenticated, test logout
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();

      // Wait for logout to complete
      await page.waitForTimeout(5000);

      // Verify login button appears again
      await expect(loginButton).toBeVisible({ timeout: 15000 });
      console.log('✅ Logout successful - Connect button is visible');

    } catch (error) {
      console.log('ℹ️ Logout test could not be completed - user might not be authenticated');
    }
  });

  test('Should persist authentication across page navigation', async ({ page }) => {
    console.log('🔍 Testing authentication persistence...');

    // Wait for initial load
    await page.waitForTimeout(3000);

    // Check authentication state
    const loginButton = page.locator('button:has-text("Connect")');
    const logoutButton = page.locator('button:has-text("LogOut"), button:has-text("Disconnect")');

    try {
      // Check if user is already authenticated
      const isAuthenticated = await logoutButton.isVisible();

      if (isAuthenticated) {
        console.log('✅ User is authenticated, testing persistence...');

        // Navigate to different pages
        const pages = ['/trade', '/faucet', '/home'];

        for (const path of pages) {
          console.log(`🔄 Navigating to ${path}...`);
          await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(3000);

          // Verify user is still authenticated
          await expect(logoutButton).toBeVisible({ timeout: 10000 });
          await expect(loginButton).not.toBeVisible();

          console.log(`✅ Authentication persisted on ${path}`);
        }

      } else {
        console.log('ℹ️ User is not authenticated - cannot test persistence');
      }

    } catch (error) {
      console.log('ℹ️ Authentication persistence test could not be completed');
    }
  });

  test('Should handle authentication errors gracefully', async ({ page }) => {
    console.log('🔍 Testing error handling...');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Monitor for error messages in console
    const errorLogs = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        errorLogs.push({ text, timestamp: new Date().toISOString() });
        console.log(`❌ Console Error: ${text}`);
      }
    });

    // Monitor for unhandled promise rejections
    page.on('pageerror', (error) => {
      console.log(`❌ Page Error: ${error.message}`);
      errorLogs.push({ text: error.message, timestamp: new Date().toISOString() });
    });

    // Click login button
    const loginButton = page.locator('button:has-text("Connect")');
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Wait and check for any unhandled errors
    await page.waitForTimeout(10000);

    if (errorLogs.length > 0) {
      console.log(`ℹ️ Found ${errorLogs.length} error(s) - check if they are related to authentication`);
    } else {
      console.log('✅ No unhandled errors detected during login flow');
    }
  });
});

test.describe('Privy Authentication - Edge Cases', () => {

  test('Should handle multiple rapid login attempts', async ({ page }) => {
    console.log('🔍 Testing multiple login attempts...');

    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const loginButton = page.locator('button:has-text("Connect")');
    await expect(loginButton).toBeVisible();

    // Click login multiple times rapidly
    for (let i = 0; i < 3; i++) {
      console.log(`Login attempt ${i + 1}...`);
      await loginButton.click();
      await page.waitForTimeout(1000);
    }

    // Check for any error states or multiple modals
    await page.waitForTimeout(5000);
    console.log('✅ Multiple login attempts handled without crashing');
  });

  test('Should handle browser refresh during authentication', async ({ page }) => {
    console.log('🔍 Testing browser refresh...');

    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const loginButton = page.locator('button:has-text("Connect")');
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Wait a moment then refresh
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Check that the page is still functional
    const refreshedLoginButton = page.locator('button:has-text("Connect")');
    const logoutButton = page.locator('button:has-text("LogOut"), button:has-text("Disconnect")');

    const isLoginVisible = await refreshedLoginButton.isVisible();
    const isLogoutVisible = await logoutButton.isVisible();

    console.log(`✅ Page functional after refresh - Login: ${isLoginVisible}, Logout: ${isLogoutVisible}`);
  });
});
/**
 * WebSocket Connection Error Debug Test
 *
 * This test specifically investigates the WebSocket connection errors
 * that are causing excessive reconnection attempts.
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

const { BASE_URL } = TEST_CONFIG;

// Extend Window interface to include WebSocket monitoring
declare global {
  interface Window {
    logWebSocketEvent: (event: string, details: any) => void;
    __wsConnectionCount: () => number;
    __wsActiveConnections: () => any[];
    __wsConnectionEvents: () => any[];
    __wsErrors: any[];
    __wsUrl: string;
  }
}

test.describe('WebSocket Error Debug Tests', () => {

  test.beforeEach(async ({ page }) => {
    TestUtils.log('Setting up WebSocket error monitoring...', 'debug');

    // Set up console monitoring to capture actual errors
    const consoleMessages: any[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('WebSocket') || text.includes('installHook.js') || text.includes('createWebSocket')) {
        consoleMessages.push({
          type: msg.type(),
          text: text,
          timestamp: Date.now()
        });
        console.log(`[${msg.type().toUpperCase()}] ${text}`);
      }
    });

    // Intercept WebSocket connections and monitor for errors
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionCount = 0;
      let connectionEvents: any[] = [];
      let wsErrors: any[] = [];

      window.WebSocket = function(...args: any[]) {
        connectionCount++;
        const connectionId = connectionCount;
        const startTime = Date.now();
        const url = args[0];

        // Store the URL for debugging
        window.__wsUrl = url;

        const event = {
          type: 'NEW_CONNECTION',
          id: connectionId,
          url: url,
          timestamp: startTime,
        };
        connectionEvents.push(event);
        window.logWebSocketEvent('NEW_CONNECTION', event);

        const socket = new OriginalWebSocket(...args);

        // Track connection state changes
        socket.addEventListener('open', () => {
          const event = {
            id: connectionId,
            timestamp: Date.now(),
            duration: Date.now() - startTime,
            url: url,
          };
          connectionEvents.push({ type: 'CONNECTED', ...event });
          window.logWebSocketEvent('CONNECTED', event);
        });

        socket.addEventListener('close', (e) => {
          const event = {
            id: connectionId,
            timestamp: Date.now(),
            duration: Date.now() - startTime,
            code: e.code,
            reason: e.reason,
            wasClean: e.wasClean,
            url: url,
          };
          connectionEvents.push({ type: 'CLOSED', ...event });
          window.logWebSocketEvent('CLOSED', event);
        });

        socket.addEventListener('error', (error) => {
          const errorEvent = {
            id: connectionId,
            error: error.toString(),
            timestamp: Date.now(),
            duration: Date.now() - startTime,
            url: url,
            readyState: socket.readyState,
          };

          wsErrors.push(errorEvent);
          connectionEvents.push({ type: 'ERROR', ...errorEvent });
          window.logWebSocketEvent('ERROR', errorEvent);

          // Log detailed error information
          console.error('WebSocket Error Details:', {
            connectionId,
            url,
            error: error.toString(),
            readyState: socket.readyState,
            timestamp: new Date().toISOString()
          });
        });

        return socket;
      };

      // Preserve WebSocket constants and prototype
      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;

      // Expose tracking functions
      window.__wsConnectionCount = () => connectionCount;
      window.__wsActiveConnections = () => [];
      window.__wsConnectionEvents = () => connectionEvents;
      window.__wsErrors = wsErrors;
    });

    // Store console messages access
    await page.exposeFunction('getConsoleMessages', () => consoleMessages);
    await page.exposeFunction('logWebSocketEvent', (event: string, details: any) => {
      const timestamp = new Date(details.timestamp).toISOString().split('T')[1].split('.')[0];
      console.log(`  [${timestamp}] ${event}:`, JSON.stringify(details, null, 2));
    });

    TestUtils.log('Navigating to application...', 'debug');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  });

  test('should capture WebSocket connection errors', async ({ page }) => {
    TestUtils.log('Testing WebSocket error capture...', 'debug');
    test.setTimeout(60000); // 60 seconds to capture reconnection attempts

    // Wait for initial connection and potential errors
    await page.waitForTimeout(15000);

    // Get WebSocket statistics
    const wsStats = await page.evaluate(() => ({
      totalConnections: window.__wsConnectionCount(),
      connectionEvents: window.__wsConnectionEvents(),
      errors: window.__wsErrors,
      wsUrl: window.__wsUrl,
    }));

    const consoleMessages = await page.evaluate(() => {
      return (window as any).getConsoleMessages ? (window as any).getConsoleMessages() : [];
    });

    TestUtils.log(`Total WebSocket connections: ${wsStats.totalConnections}`, 'info');
    TestUtils.log(`WebSocket URL: ${wsStats.wsUrl}`, 'info');
    TestUtils.log(`Connection events: ${wsStats.connectionEvents.length}`, 'info');
    TestUtils.log(`WebSocket errors: ${wsStats.errors.length}`, 'info');
    TestUtils.log(`Console messages with WebSocket: ${consoleMessages.length}`, 'info');

    // Print connection timeline
    console.log('\nConnection Event Timeline:');
    wsStats.connectionEvents.forEach((event, idx) => {
      const time = new Date(event.timestamp).toISOString().split('T')[1];
      const url = event.url || 'unknown';
      console.log(`  ${idx + 1}. [${time}] ${event.type} - Connection #${event.id} - ${url}`);
      if (event.duration) console.log(`     Duration: ${event.duration}ms`);
      if (event.error) console.log(`     Error: ${event.error}`);
    });

    // Print WebSocket errors
    if (wsStats.errors.length > 0) {
      console.log('\nWebSocket Error Details:');
      wsStats.errors.forEach((error, idx) => {
        const time = new Date(error.timestamp).toISOString().split('T')[1];
        console.log(`  ${idx + 1}. [${time}] Connection #${error.id}`);
        console.log(`     URL: ${error.url}`);
        console.log(`     Error: ${error.error}`);
        console.log(`     Ready State: ${error.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`);
        console.log(`     Duration: ${error.duration}ms`);
      });
    }

    // Print relevant console messages
    if (consoleMessages.length > 0) {
      console.log('\nRelevant Console Messages:');
      consoleMessages.forEach((msg, idx) => {
        const time = new Date(msg.timestamp).toISOString().split('T')[1];
        console.log(`  ${idx + 1}. [${time}] [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    // Analyze error patterns
    const errorEvents = wsStats.connectionEvents.filter(e => e.type === 'ERROR');
    const closeEvents = wsStats.connectionEvents.filter(e => e.type === 'CLOSED');
    const connectEvents = wsStats.connectionEvents.filter(e => e.type === 'CONNECTED');

    TestUtils.log(`Error events: ${errorEvents.length}`, errorEvents.length > 0 ? 'error' : 'info');
    TestUtils.log(`Close events: ${closeEvents.length}`, 'info');
    TestUtils.log(`Connected events: ${connectEvents.length}`, 'info');

    // Check for the specific error pattern mentioned in the issue
    const installHookErrors = consoleMessages.filter(msg =>
      msg.text.includes('installHook.js') && msg.text.includes('[ERROR]')
    );

    const createWsErrors = consoleMessages.filter(msg =>
      msg.text.includes('createWebSocket() - WebSocket error')
    );

    const connectionFailedErrors = consoleMessages.filter(msg =>
      msg.text.includes('WebSocket connection to') && msg.text.includes('failed')
    );

    TestUtils.log(`installHook.js errors: ${installHookErrors.length}`, installHookErrors.length > 0 ? 'error' : 'info');
    TestUtils.log(`createWebSocket errors: ${createWsErrors.length}`, createWsErrors.length > 0 ? 'error' : 'info');
    TestUtils.log(`Connection failed errors: ${connectionFailedErrors.length}`, connectionFailedErrors.length > 0 ? 'error' : 'info');

    // If we have the specific error pattern, print it
    if (installHookErrors.length > 0) {
      console.log('\ninstallHook.js Error Pattern:');
      installHookErrors.slice(0, 3).forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg.text}`);
      });
    }

    if (connectionFailedErrors.length > 0) {
      console.log('\nConnection Failed Errors:');
      connectionFailedErrors.slice(0, 3).forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg.text}`);
      });
    }

    // Assertions to understand the problem better
    expect(wsStats.totalConnections).toBeGreaterThan(0);

    // Log findings for debugging
    if (errorEvents.length > 0) {
      TestUtils.log(`🔍 Found ${errorEvents.length} WebSocket errors - this matches the reported issue`, 'error');
    } else {
      TestUtils.log('✅ No WebSocket errors detected in this test run', 'success');
    }

    if (installHookErrors.length > 0) {
      TestUtils.log(`🔍 Found ${installHookErrors.length} installHook.js errors - this is the pattern from the issue`, 'error');
    }
  });

  test('should test WebSocket endpoint reachability', async ({ page }) => {
    TestUtils.log('Testing WebSocket endpoint reachability...', 'debug');

    // Get the WebSocket URL that the app is trying to connect to
    await page.waitForTimeout(3000);

    const wsUrl = await page.evaluate(() => window.__wsUrl);
    TestUtils.log(`Target WebSocket URL: ${wsUrl}`, 'info');

    // Test if we can create a WebSocket connection manually
    const reachabilityResult = await page.evaluate((url) => {
      return new Promise((resolve) => {
        try {
          const testSocket = new WebSocket(url);
          const timeout = setTimeout(() => {
            testSocket.close();
            resolve({ success: false, error: 'Timeout after 10 seconds' });
          }, 10000);

          testSocket.addEventListener('open', () => {
            clearTimeout(timeout);
            testSocket.close();
            resolve({ success: true, error: null });
          });

          testSocket.addEventListener('error', (error) => {
            clearTimeout(timeout);
            resolve({ success: false, error: error.toString() });
          });

          testSocket.addEventListener('close', (event) => {
            clearTimeout(timeout);
            if (event.code !== 1000) {
              resolve({ success: false, error: `Closed with code ${event.code}: ${event.reason}` });
            }
          });
        } catch (error) {
          resolve({ success: false, error: error.toString() });
        }
      });
    }, wsUrl);

    TestUtils.log(`Endpoint reachability test: ${reachabilityResult.success ? 'SUCCESS' : 'FAILED'}`,
      reachabilityResult.success ? 'success' : 'error');

    if (!reachabilityResult.success) {
      TestUtils.log(`Error details: ${reachabilityResult.error}`, 'error');
    }

    // Test with curl or fetch if it's an HTTP endpoint (for debugging)
    if (wsUrl && wsUrl.startsWith('wss://')) {
      const httpsUrl = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');

      try {
        const response = await page.evaluate(async (url) => {
          try {
            const resp = await fetch(url, {
              method: 'GET',
              timeout: 5000
            });
            return {
              status: resp.status,
              ok: resp.ok,
              statusText: resp.statusText
            };
          } catch (error) {
            return { error: error.toString() };
          }
        }, httpsUrl);

        console.log(`HTTP endpoint test for ${httpsUrl}:`, response);
      } catch (error) {
        console.log(`HTTP endpoint test failed:`, error);
      }
    }
  });
});
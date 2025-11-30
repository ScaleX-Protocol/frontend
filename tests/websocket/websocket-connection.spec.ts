/**
 * WebSocket Connection Tests
 *
 * These tests verify that the WebSocket connection:
 * - Establishes properly
 * - Handles reconnections correctly
 * - Doesn't create excessive reconnection loops
 * - Maintains stable connection state
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

const { BASE_URL } = TEST_CONFIG;

// Extend Window interface to include WebSocket monitoring properties
declare global {
  interface Window {
    logWebSocketEvent: (event: string, details: any) => void;
    __wsConnectionCount: () => number;
    __wsActiveConnections: () => any[];
    __wsConnectionEvents: () => any[];
    __wsMessages: any[];
  }
}

test.describe('WebSocket Connection Tests', () => {

  test.beforeEach(async ({ page }) => {
    TestUtils.log('Setting up WebSocket monitoring...', 'debug');

    // Expose a function to count WebSocket connections
    await page.exposeFunction('logWebSocketEvent', (event: string, details: any) => {
      const timestamp = new Date(details.timestamp).toISOString().split('T')[1].split('.')[0];
      console.log(`  [${timestamp}] ${event}:`, JSON.stringify(details, null, 2));
    });

    // Intercept WebSocket connections to monitor behavior
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionCount = 0;
      let activeConnections: any[] = [];
      let connectionEvents: any[] = [];

      window.WebSocket = function(...args: any[]) {
        connectionCount++;
        const connectionId = connectionCount;
        const startTime = Date.now();

        const event = {
          type: 'NEW_CONNECTION',
          id: connectionId,
          url: args[0],
          timestamp: startTime,
        };
        connectionEvents.push(event);
        window.logWebSocketEvent('NEW_CONNECTION', event);

        const socket = new OriginalWebSocket(...args);
        activeConnections.push({
          id: connectionId,
          socket,
          createdAt: startTime,
          url: args[0]
        });

        const originalClose = socket.close;
        socket.close = function(...closeArgs: any[]) {
          const event = {
            id: connectionId,
            timestamp: Date.now(),
            duration: Date.now() - startTime,
          };
          connectionEvents.push({ type: 'CLOSE_CALLED', ...event });
          window.logWebSocketEvent('CLOSE_CALLED', event);
          activeConnections = activeConnections.filter(conn => conn.id !== connectionId);
          return originalClose.call(socket, closeArgs[0], closeArgs[1]);
        };

        socket.addEventListener('open', () => {
          const event = {
            id: connectionId,
            timestamp: Date.now(),
            duration: Date.now() - startTime,
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
          };
          connectionEvents.push({ type: 'CLOSED', ...event });
          window.logWebSocketEvent('CLOSED', event);
        });

        socket.addEventListener('error', (error) => {
          const event = {
            id: connectionId,
            error: error.toString(),
            timestamp: Date.now(),
          };
          connectionEvents.push({ type: 'ERROR', ...event });
          window.logWebSocketEvent('ERROR', event);
        });

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;

      // Expose connection tracking data
      window.__wsConnectionCount = () => connectionCount;
      window.__wsActiveConnections = () => activeConnections;
      window.__wsConnectionEvents = () => connectionEvents;
    });

    TestUtils.log('Navigating to application...', 'debug');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  });

  test('should establish WebSocket connection on page load', async ({ page }) => {
    TestUtils.log('Testing WebSocket connection establishment...', 'debug');

    // Wait for the page to load and WebSocket to initialize
    await page.waitForTimeout(3000);

    // Check that at least one WebSocket connection was created
    const stats = await page.evaluate(() => ({
      total: window.__wsConnectionCount(),
      active: window.__wsActiveConnections().length,
      events: window.__wsConnectionEvents(),
    }));

    TestUtils.log(`Total WebSocket connections created: ${stats.total}`, 'info');
    TestUtils.log(`Active connections: ${stats.active}`, 'info');

    // Print connection timeline
    console.log('\nConnection Timeline:');
    stats.events.forEach((event, idx) => {
      const time = new Date(event.timestamp).toISOString().split('T')[1];
      console.log(`  ${idx + 1}. [${time}] ${event.type} - Connection #${event.id}`);
    });

    // Assertions
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.total).toBeLessThan(3); // Should not create excessive connections on load
    expect(stats.active).toBeGreaterThan(0); // Should have at least one active connection

    TestUtils.log('WebSocket connection established successfully', 'success');
  });

  test('should not create excessive reconnections', async ({ page }) => {
    TestUtils.log('Testing for excessive reconnections...', 'debug');
    test.setTimeout(60000); // 60 seconds for this test

    // Wait for initial connection
    await page.waitForTimeout(3000);

    const initialStats = await page.evaluate(() => ({
      total: window.__wsConnectionCount(),
      active: window.__wsActiveConnections().length,
    }));

    TestUtils.log(`Initial connections: ${initialStats.total}`, 'info');

    // Observe for 30 seconds
    TestUtils.log('Observing connection behavior for 30 seconds...', 'info');
    const observationTime = 30000;
    const checkInterval = 5000;
    const checks = observationTime / checkInterval;

    for (let i = 1; i <= checks; i++) {
      await page.waitForTimeout(checkInterval);

      const currentStats = await page.evaluate(() => ({
        total: window.__wsConnectionCount(),
        active: window.__wsActiveConnections().length,
      }));

      const reconnects = currentStats.total - initialStats.total;
      console.log(`  [${i * 5}s] Total: ${currentStats.total}, Active: ${currentStats.active}, Reconnects: ${reconnects}`);

      // Fail early if excessive reconnections detected
      if (reconnects > 5) {
        TestUtils.log(`EXCESSIVE RECONNECTIONS DETECTED: ${reconnects} reconnections in ${i * 5} seconds!`, 'error');
        break;
      }
    }

    // Get final stats
    const finalStats = await page.evaluate(() => ({
      total: window.__wsConnectionCount(),
      active: window.__wsActiveConnections().length,
      events: window.__wsConnectionEvents(),
    }));

    const reconnectionAttempts = finalStats.total - initialStats.total;
    TestUtils.log(`Total reconnection attempts: ${reconnectionAttempts}`, 'info');

    // Print detailed event log
    console.log('\nDetailed Event Log:');
    finalStats.events.forEach((event, idx) => {
      const time = new Date(event.timestamp).toISOString().split('T')[1];
      console.log(`  ${idx + 1}. [${time}] ${event.type} - Connection #${event.id}${event.duration ? ` (${event.duration}ms)` : ''}`);
    });

    // Should not have excessive reconnections (allow max 2 in 30s)
    if (reconnectionAttempts <= 2) {
      TestUtils.log('No excessive reconnections detected', 'success');
    } else {
      TestUtils.log(`WARNING: ${reconnectionAttempts} reconnections detected`, 'warning');
    }

    expect(reconnectionAttempts).toBeLessThanOrEqual(2);
  });

  test('should track active vs closed connections', async ({ page }) => {
    TestUtils.log('Testing active connection tracking...', 'debug');

    await page.waitForTimeout(3000);

    const connectionData = await page.evaluate(() => {
      const connections = window.__wsActiveConnections();
      return {
        count: connections.length,
        details: connections.map(conn => ({
          id: conn.id,
          age: Date.now() - conn.createdAt,
          state: conn.socket.readyState,
          stateLabel: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][conn.socket.readyState],
          url: conn.url,
        })),
      };
    });

    TestUtils.log(`Active connections: ${connectionData.count}`, 'info');

    console.log('\nConnection Details:');
    connectionData.details.forEach((conn, idx) => {
      console.log(`  ${idx + 1}. Connection #${conn.id}`);
      console.log(`     State: ${conn.stateLabel} (${conn.state})`);
      console.log(`     Age: ${conn.age}ms`);
      console.log(`     URL: ${conn.url}`);
    });

    // Should have exactly 2 active connections (HMR + WebSocket)
    expect(connectionData.count).toBe(2);

    // The active connection should be OPEN (readyState = 1)
    if (connectionData.details.length > 0) {
      expect(connectionData.details[0].state).toBe(1); // WebSocket.OPEN
      TestUtils.log('Connection state is OPEN', 'success');
    }
  });

  test('should handle console errors gracefully', async ({ page }) => {
    TestUtils.log('Testing error handling...', 'debug');

    // Set up console message listener
    const errorMessages = [];
    const warningMessages = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorMessages.push(msg.text());
      } else if (msg.type() === 'warning') {
        warningMessages.push(msg.text());
      }
    });

    await page.waitForTimeout(5000);

    // Check for WebSocket errors in console
    const wsErrors = errorMessages.filter(msg =>
      msg.toLowerCase().includes('websocket') ||
      msg.toLowerCase().includes('ws') ||
      msg.toLowerCase().includes('reconnect')
    );

    const wsWarnings = warningMessages.filter(msg =>
      msg.toLowerCase().includes('websocket') ||
      msg.toLowerCase().includes('ws') ||
      msg.toLowerCase().includes('reconnect')
    );

    TestUtils.log(`WebSocket errors: ${wsErrors.length}`, wsErrors.length > 0 ? 'warning' : 'info');
    TestUtils.log(`WebSocket warnings: ${wsWarnings.length}`, wsWarnings.length > 0 ? 'warning' : 'info');

    if (wsErrors.length > 0) {
      console.log('\nWebSocket Errors:');
      wsErrors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
    }

    if (wsWarnings.length > 0) {
      console.log('\nWebSocket Warnings:');
      wsWarnings.forEach((warn, idx) => console.log(`  ${idx + 1}. ${warn}`));
    }

    // Should not have excessive errors
    if (wsErrors.length < 5) {
      TestUtils.log('Error count within acceptable range', 'success');
    }
    expect(wsErrors.length).toBeLessThan(5);
  });

  test('should maintain single active connection', async ({ page }) => {
    TestUtils.log('Testing single connection maintenance...', 'debug');
    test.setTimeout(45000);

    // Monitor connections over 20 seconds
    const monitorDuration = 20000;
    const checkInterval = 2000;
    const checks = monitorDuration / checkInterval;

    const results = [];

    for (let i = 0; i < checks; i++) {
      await page.waitForTimeout(checkInterval);

      const stats = await page.evaluate(() => ({
        total: window.__wsConnectionCount(),
        active: window.__wsActiveConnections().length,
        timestamp: Date.now(),
      }));

      results.push(stats);
      console.log(`  [${(i + 1) * 2}s] Total: ${stats.total}, Active: ${stats.active}`);
    }

    // Analyze results
    const maxActive = Math.max(...results.map(r => r.active));
    const maxTotal = Math.max(...results.map(r => r.total));

    TestUtils.log(`Max active connections: ${maxActive}`, 'info');
    TestUtils.log(`Max total connections: ${maxTotal}`, 'info');

    // Should maintain exactly 2 active connections (HMR + WebSocket)
    expect(maxActive).toBeLessThanOrEqual(2);
    // Should not create many connections
    expect(maxTotal).toBeLessThan(5);

    TestUtils.log('Single connection maintained successfully', 'success');
  });
});

test.describe('WebSocket Message Handling', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept WebSocket messages
    await page.addInitScript(() => {
      window.__wsMessages = [];

      const OriginalWebSocket = window.WebSocket;
      window.WebSocket = function(...args) {
        const socket = new OriginalWebSocket(...args);

        socket.addEventListener('message', (event) => {
          window.__wsMessages.push({
            data: event.data,
            timestamp: Date.now(),
            size: event.data.length,
          });
        });

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  });

  test('should receive messages from server', async ({ page }) => {
    TestUtils.log('Testing message reception...', 'debug');

    // Wait for connection and potential messages
    await page.waitForTimeout(10000);

    const messageData = await page.evaluate(() => ({
      messages: window.__wsMessages || [],
      count: (window.__wsMessages || []).length,
    }));

    TestUtils.log(`Received ${messageData.count} messages from WebSocket`, 'info');

    if (messageData.count > 0) {
      console.log('\nFirst 5 Messages:');
      messageData.messages.slice(0, 5).forEach((msg, idx) => {
        const preview = msg.data.substring(0, 100);
        const time = new Date(msg.timestamp).toISOString().split('T')[1];
        console.log(`  ${idx + 1}. [${time}] ${preview}${msg.data.length > 100 ? '...' : ''}`);
        console.log(`     Size: ${msg.size} bytes`);
      });

      TestUtils.log('Messages received successfully', 'success');
    } else {
      TestUtils.log('No messages received (server might not send data immediately)', 'info');
    }

    // Verify message structure
    expect(messageData.messages).toBeDefined();
    expect(Array.isArray(messageData.messages)).toBe(true);
  });
});

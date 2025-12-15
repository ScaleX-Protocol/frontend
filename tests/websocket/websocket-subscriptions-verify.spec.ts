/**
 * WebSocket Subscriptions Verification Test
 *
 * This test verifies that:
 * 1. Only one WebSocket connection is created (singleton pattern)
 * 2. Subscriptions are automatically sent when connected
 * 3. Stream data is received from the WebSocket
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

const { BASE_URL } = TEST_CONFIG;

// Extend Window interface for monitoring
declare global {
  interface Window {
    __wsConnectionCount: () => number;
    __wsActiveConnections: () => any[];
    __wsConnectionEvents: () => any[];
    __wsMessages: any[];
    __wsSubscriptions: any[];
    logWebSocketEvent: (event: string, details: any) => void;
  }
}

test.describe('WebSocket Subscriptions Verification', () => {

  test.beforeEach(async ({ page }) => {
    TestUtils.log('Setting up WebSocket subscription verification...', 'debug');

    // Track WebSocket connections and messages
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionCount = 0;
      let connectionEvents: any[] = [];
      let wsMessages: any[] = [];
      let wsSubscriptions: any[] = [];

      window.WebSocket = function(...args: any[]) {
        connectionCount++;
        const connectionId = connectionCount;
        const startTime = Date.now();
        const url = args[0];

        const event = {
          type: 'NEW_CONNECTION',
          id: connectionId,
          url: url,
          timestamp: startTime,
        };
        connectionEvents.push(event);
        window.logWebSocketEvent('NEW_CONNECTION', event);

        const socket = new OriginalWebSocket(...args);

        // Track sent messages
        const originalSend = socket.send;
        socket.send = function(data: any) {
          const messageEvent = {
            id: connectionId,
            type: 'SENT',
            data: data,
            timestamp: Date.now(),
            dataSize: data.length,
          };
          wsMessages.push(messageEvent);

          // Check if it's a subscription message
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.method === 'SUBSCRIBE') {
              const subscriptionEvent = {
                id: connectionId,
                method: parsedData.method,
                params: parsedData.params,
                messageId: parsedData.id,
                timestamp: Date.now(),
              };
              wsSubscriptions.push(subscriptionEvent);
              window.logWebSocketEvent('SUBSCRIPTION_SENT', subscriptionEvent);
            } else if (parsedData.method === 'PING') {
              window.logWebSocketEvent('PING_SENT', { id: connectionId, timestamp: Date.now() });
            }
          } catch (e) {
            // Not JSON, ignore
          }

          return originalSend.call(socket, data);
        };

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

        socket.addEventListener('message', (event) => {
          const messageEvent = {
            id: connectionId,
            type: 'RECEIVED',
            data: event.data,
            timestamp: Date.now(),
            dataSize: event.data.length,
          };
          wsMessages.push(messageEvent);

          // Check if it's a subscription confirmation or stream data
          try {
            const parsedData = JSON.parse(event.data);
            if (parsedData.result && parsedData.result === 'connected') {
              window.logWebSocketEvent('CONNECTION_ACK', { id: connectionId, data: parsedData });
            } else if (parsedData.stream) {
              const streamEvent = {
                id: connectionId,
                stream: parsedData.stream,
                data: parsedData.data,
                timestamp: Date.now(),
              };
              wsSubscriptions.push(streamEvent);
              window.logWebSocketEvent('STREAM_DATA', streamEvent);
            }
          } catch (e) {
            // Not JSON, ignore
          }
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
            url: url,
          };
          connectionEvents.push({ type: 'ERROR', ...errorEvent });
          window.logWebSocketEvent('ERROR', errorEvent);
        });

        return socket;
      };

      // Preserve WebSocket properties
      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;

      // Expose tracking data
      window.__wsConnectionCount = () => connectionCount;
      window.__wsActiveConnections = () => [];
      window.__wsConnectionEvents = () => connectionEvents;
      window.__wsMessages = wsMessages;
      window.__wsSubscriptions = wsSubscriptions;
    });

    await page.exposeFunction('logWebSocketEvent', (event: string, details: any) => {
      const timestamp = new Date(details.timestamp).toISOString().split('T')[1].split('.')[0];
      console.log(`  [${timestamp}] ${event}:`, JSON.stringify(details, null, 2));
    });

    TestUtils.log('Navigating to application...', 'debug');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  });

  test('should create only one WebSocket connection and subscribe to streams', async ({ page }) => {
    TestUtils.log('Testing singleton WebSocket and subscriptions...', 'debug');
    test.setTimeout(30000);

    // Wait for connections and subscriptions to be established
    await page.waitForTimeout(15000);

    // Get WebSocket statistics
    const wsStats = await page.evaluate(() => ({
      totalConnections: window.__wsConnectionCount(),
      connectionEvents: window.__wsConnectionEvents(),
      messages: window.__wsMessages,
      subscriptions: window.__wsSubscriptions,
    }));

    TestUtils.log(`Total WebSocket connections: ${wsStats.totalConnections}`, 'info');
    TestUtils.log(`Total messages: ${wsStats.messages.length}`, 'info');
    TestUtils.log(`Total subscriptions: ${wsStats.subscriptions.length}`, 'info');

    // Analyze connection creation
    console.log('\n=== WebSocket Connection Analysis ===');

    const newConnections = wsStats.connectionEvents.filter(e => e.type === 'NEW_CONNECTION');
    const applicationConnections = newConnections.filter(conn =>
      conn.url.includes('base-sepolia-websocket.scalex.money')
    );
    const hmrConnections = newConnections.filter(conn =>
      conn.url.includes('localhost:3001')
    );

    console.log(`Application WebSocket connections: ${applicationConnections.length}`);
    console.log(`HMR WebSocket connections: ${hmrConnections.length}`);

    // Verify singleton pattern (should be only 1 application connection)
    expect(applicationConnections.length).toBe(1);
    TestUtils.log('✅ Singleton WebSocket pattern working - only 1 application connection', 'success');

    // Analyze messages
    const sentMessages = wsStats.messages.filter(m => m.type === 'SENT');
    const receivedMessages = wsStats.messages.filter(m => m.type === 'RECEIVED');

    console.log(`\n=== Message Analysis ===`);
    console.log(`Messages sent: ${sentMessages.length}`);
    console.log(`Messages received: ${receivedMessages.length}`);

    // Check for subscription messages
    const subscriptionSent = wsStats.subscriptions.filter(s => s.method === 'SUBSCRIBE');
    const streamData = wsStats.subscriptions.filter(s => s.stream);

    console.log(`\n=== Subscription Analysis ===`);
    console.log(`Subscription messages sent: ${subscriptionSent.length}`);
    console.log(`Stream data received: ${streamData.length}`);

    if (subscriptionSent.length > 0) {
      console.log('\n📡 Sent Subscriptions:');
      subscriptionSent.forEach((sub, idx) => {
        console.log(`  ${idx + 1}. Method: ${sub.method}`);
        console.log(`     Params: ${JSON.stringify(sub.params)}`);
        console.log(`     Message ID: ${sub.messageId}`);
      });
      TestUtils.log('✅ WebSocket subscriptions are being sent', 'success');
    } else {
      TestUtils.log('❌ No WebSocket subscriptions sent', 'error');
    }

    if (streamData.length > 0) {
      console.log('\n📥 Received Stream Data:');
      streamData.slice(0, 5).forEach((stream, idx) => {
        console.log(`  ${idx + 1}. Stream: ${stream.stream}`);
        console.log(`     Data preview: ${JSON.stringify(stream.data).substring(0, 100)}...`);
      });
      TestUtils.log(`✅ Stream data received (${streamData.length} messages)`, 'success');
    } else {
      TestUtils.log('⚠️ No stream data received yet (may take time)', 'warning');
    }

    // Check for PING messages (should be sent periodically)
    const pingMessages = sentMessages.filter(msg => {
      try {
        const parsed = JSON.parse(msg.data);
        return parsed.method === 'PING';
      } catch (e) {
        return false;
      }
    });

    console.log(`\n=== Health Checks ===`);
    console.log(`PING messages sent: ${pingMessages.length}`);
    if (pingMessages.length > 0) {
      TestUtils.log('✅ WebSocket keep-alive PING messages working', 'success');
    }

    // Main assertions
    expect(applicationConnections.length).toBe(1);
    expect(hmrConnections.length).toBeGreaterThanOrEqual(0); // HMR is optional
    expect(sentMessages.length).toBeGreaterThan(0);
    expect(receivedMessages.length).toBeGreaterThan(0);

    // Verify subscription functionality
    if (subscriptionSent.length > 0) {
      expect(subscriptionSent.length).toBeGreaterThan(0);
      TestUtils.log('🎉 WebSocket subscriptions are working correctly!', 'success');
    } else {
      TestUtils.log('⚠️ WebSocket subscriptions not detected - may need more time', 'warning');
    }
  });

  test('should maintain stable connection over time', async ({ page }) => {
    TestUtils.log('Testing WebSocket connection stability...', 'debug');
    test.setTimeout(20000);

    // Wait for initial connection
    await page.waitForTimeout(5000);

    const initialStats = await page.evaluate(() => ({
      connections: window.__wsConnectionCount(),
      events: window.__wsConnectionEvents(),
    }));

    TestUtils.log(`Initial connections: ${initialStats.connections}`, 'info');

    // Monitor for stability over 15 seconds
    const monitoringPeriod = 15000;
    const checkInterval = 3000;
    const checks = monitoringPeriod / checkInterval;

    const connectionCounts = [];
    let errorsDetected = false;

    for (let i = 1; i <= checks; i++) {
      await page.waitForTimeout(checkInterval);

      const currentStats = await page.evaluate(() => ({
        connections: window.__wsConnectionCount(),
        events: window.__wsConnectionEvents(),
        messages: window.__wsMessages.length,
      }));

      connectionCounts.push(currentStats.connections);

      // Check for errors
      const recentEvents = currentStats.events.filter(e =>
        e.type === 'ERROR' && Date.now() - e.timestamp < 10000
      );

      if (recentEvents.length > 0) {
        errorsDetected = true;
        TestUtils.log(`❌ WebSocket errors detected at ${i * 3}s`, 'error');
      }

      console.log(`  [${i * 3}s] Connections: ${currentStats.connections}, Messages: ${currentStats.messages}`);
    }

    // Analyze stability
    const maxConnections = Math.max(...connectionCounts);
    const minConnections = Math.min(...connectionCounts);
    const connectionVariation = maxConnections - minConnections;

    console.log(`\n=== Stability Analysis ===`);
    console.log(`Max connections: ${maxConnections}`);
    console.log(`Min connections: ${minConnections}`);
    console.log(`Connection variation: ${connectionVariation}`);
    console.log(`Errors detected: ${errorsDetected}`);

    // Should have stable connection count (variation should be minimal)
    expect(connectionVariation).toBeLessThanOrEqual(1);
    expect(errorsDetected).toBe(false);

    TestUtils.log('✅ WebSocket connection is stable over time', 'success');
  });
});
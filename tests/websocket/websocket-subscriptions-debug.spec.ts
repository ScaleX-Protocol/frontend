/**
 * WebSocket Subscription Analysis Test
 *
 * This test investigates:
 * 1. Why multiple WebSocket connections are being created
 * 2. Why none of them are subscribing to streams
 * 3. The connection lifecycle and subscription behavior
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

const { BASE_URL } = TEST_CONFIG;

// Extend Window interface for monitoring
declare global {
  interface Window {
    logWebSocketEvent: (event: string, details: any) => void;
    __wsConnectionCount: () => number;
    __wsActiveConnections: () => any[];
    __wsConnectionEvents: () => any[];
    __wsMessages: any[];
    __wsSubscriptions: any[];
    __wsComponents: any[];
    __logComponentUsage: (component: string, action: string, details: any) => void;
  }
}

test.describe('WebSocket Subscription Analysis', () => {

  test.beforeEach(async ({ page }) => {
    TestUtils.log('Setting up WebSocket subscription monitoring...', 'debug');

    const componentUsage: any[] = [];

    // Set up component usage tracking
    await page.exposeFunction('__logComponentUsage', (component: string, action: string, details: any) => {
      componentUsage.push({
        component,
        action,
        details,
        timestamp: Date.now()
      });
      console.log(`[${new Date().toISOString().split('T')[1]}] COMPONENT: ${component} - ${action}`, details);
    });

    // Intercept WebSocket connections and monitor everything
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionCount = 0;
      let connectionEvents: any[] = [];
      let wsMessages: any[] = [];
      let wsSubscriptions: any[] = [];
      let wsComponents: any[] = [];

      window.WebSocket = function(...args: any[]) {
        connectionCount++;
        const connectionId = connectionCount;
        const startTime = Date.now();
        const url = args[0];
        const protocols = args[1];

        const event = {
          type: 'NEW_CONNECTION',
          id: connectionId,
          url: url,
          protocols: protocols,
          timestamp: startTime,
          stackTrace: new Error().stack,
        };
        connectionEvents.push(event);
        window.logWebSocketEvent('NEW_CONNECTION', event);

        const socket = new OriginalWebSocket(...args);

        // Track messages sent and received
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
          connectionEvents.push({ type: 'MESSAGE_SENT', ...messageEvent });

          // Check if it's a subscription message
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.method === 'SUBSCRIBE') {
              const subscriptionEvent = {
                id: connectionId,
                method: parsedData.method,
                params: parsedData.params,
                id: parsedData.id,
                timestamp: Date.now(),
              };
              wsSubscriptions.push(subscriptionEvent);
              window.logWebSocketEvent('SUBSCRIPTION_SENT', subscriptionEvent);
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
            readyState: socket.readyState,
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
          connectionEvents.push({ type: 'MESSAGE_RECEIVED', ...messageEvent });

          // Check if it's a subscription confirmation
          try {
            const parsedData = JSON.parse(event.data);
            if (parsedData.result || parsedData.stream) {
              const subscriptionEvent = {
                id: connectionId,
                type: parsedData.result ? 'SUBSCRIPTION_ACK' : 'STREAM_DATA',
                data: parsedData,
                timestamp: Date.now(),
              };
              wsSubscriptions.push(subscriptionEvent);
              window.logWebSocketEvent('SUBSCRIPTION_DATA', subscriptionEvent);
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
            duration: Date.now() - startTime,
            url: url,
            readyState: socket.readyState,
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
      window.__wsComponents = wsComponents;

      // Monitor component mounting (intercept React rendering)
      const originalCreateElement = React.createElement;
      React.createElement = function(type: any, props: any, ...children: any[]) {
        if (typeof type === 'function' && type.name) {
          window.__logComponentUsage(type.name, 'MOUNT', { props, children });
        } else if (typeof type === 'string' && ['WebSocketProvider', 'useWebSocket'].some(name => type.includes(name))) {
          window.__logComponentUsage(type, 'ELEMENT', { props, children });
        }
        return originalCreateElement.call(this, type, props, ...children);
      };
    });

    // Store component usage data access
    await page.exposeFunction('getComponentUsage', () => componentUsage);
    await page.exposeFunction('logWebSocketEvent', (event: string, details: any) => {
      const timestamp = new Date(details.timestamp).toISOString().split('T')[1].split('.')[0];
      console.log(`  [${timestamp}] ${event}:`, JSON.stringify(details, null, 2));
    });

    TestUtils.log('Navigating to application...', 'debug');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  });

  test('should analyze WebSocket connection creation patterns', async ({ page }) => {
    TestUtils.log('Analyzing WebSocket connection patterns...', 'debug');
    test.setTimeout(30000);

    // Wait for initial connections to establish
    await page.waitForTimeout(5000);

    // Get WebSocket statistics
    const wsStats = await page.evaluate(() => ({
      totalConnections: window.__wsConnectionCount(),
      connectionEvents: window.__wsConnectionEvents(),
      messages: window.__wsMessages,
      subscriptions: window.__wsSubscriptions,
      componentUsage: (window as any).getComponentUsage(),
    }));

    TestUtils.log(`Total WebSocket connections: ${wsStats.totalConnections}`, 'info');
    TestUtils.log(`Total messages: ${wsStats.messages.length}`, 'info');
    TestUtils.log(`Total subscriptions: ${wsStats.subscriptions.length}`, 'info');
    TestUtils.log(`Component usage events: ${wsStats.componentUsage.length}`, 'info');

    // Analyze connection creation
    console.log('\n=== WebSocket Connection Analysis ===');

    const newConnections = wsStats.connectionEvents.filter(e => e.type === 'NEW_CONNECTION');
    console.log(`\n📡 New Connections Created: ${newConnections.length}`);

    newConnections.forEach((conn, idx) => {
      console.log(`  ${idx + 1}. Connection #${conn.id}`);
      console.log(`     URL: ${conn.url}`);
      console.log(`     Timestamp: ${new Date(conn.timestamp).toISOString().split('T')[1]}`);
      console.log(`     Protocols: ${conn.protocols || 'none'}`);

      if (conn.stackTrace) {
        const stackLines = conn.stackTrace.split('\n');
        const relevantLines = stackLines.filter(line =>
          line.includes('websocket') ||
          line.includes('WebSocket') ||
          line.includes('createWebSocket') ||
          line.includes('useWebSocket')
        ).slice(0, 3);

        if (relevantLines.length > 0) {
          console.log(`     Stack trace:`);
          relevantLines.forEach(line => {
            console.log(`       ${line.trim()}`);
          });
        }
      }
    });

    // Analyze connected vs failed connections
    const connectedEvents = wsStats.connectionEvents.filter(e => e.type === 'CONNECTED');
    const errorEvents = wsStats.connectionEvents.filter(e => e.type === 'ERROR');
    const closeEvents = wsStats.connectionEvents.filter(e => e.type === 'CLOSED');

    console.log(`\n✅ Successful Connections: ${connectedEvents.length}`);
    console.log(`❌ Connection Errors: ${errorEvents.length}`);
    console.log(`🔌 Closed Connections: ${closeEvents.length}`);

    // Analyze messages
    console.log(`\n💬 Message Analysis (${wsStats.messages.length} total messages):`);
    const sentMessages = wsStats.messages.filter(m => m.type === 'SENT');
    const receivedMessages = wsStats.messages.filter(m => m.type === 'RECEIVED');

    console.log(`  Sent: ${sentMessages.length}`);
    console.log(`  Received: ${receivedMessages.length}`);

    if (sentMessages.length > 0) {
      console.log('\n📤 Sent Messages:');
      sentMessages.forEach((msg, idx) => {
        try {
          const parsed = JSON.parse(msg.data);
          console.log(`  ${idx + 1}. ${parsed.method || 'DATA'} - ${JSON.stringify(parsed).substring(0, 100)}...`);
        } catch (e) {
          console.log(`  ${idx + 1}. RAW: ${msg.data.substring(0, 100)}...`);
        }
      });
    }

    // Analyze subscriptions
    console.log(`\n📡 Subscription Analysis (${wsStats.subscriptions.length} total):`);
    wsStats.subscriptions.forEach((sub, idx) => {
      console.log(`  ${idx + 1}. ${sub.type} - Connection #${sub.id}`);
      if (sub.method) {
        console.log(`     Method: ${sub.method}`);
        console.log(`     Params: ${JSON.stringify(sub.params)}`);
      }
      if (sub.data && sub.data.stream) {
        console.log(`     Stream: ${sub.data.stream}`);
      }
    });

    // Analyze component usage to understand what's creating WebSockets
    console.log(`\n🧩 Component Usage Analysis:`);
    const componentTypes = {};
    wsStats.componentUsage.forEach(usage => {
      if (!componentTypes[usage.component]) {
        componentTypes[usage.component] = 0;
      }
      componentTypes[usage.component]++;
    });

    Object.entries(componentTypes).forEach(([component, count]) => {
      console.log(`  ${component}: ${count} uses`);
    });

    // Key assertions
    expect(newConnections.length).toBeGreaterThan(0);
    expect(connectedEvents.length).toBeGreaterThan(0);

    // Issue detection
    const hasNoSubscriptions = wsStats.subscriptions.length === 0;
    const hasMultipleConnections = newConnections.length > 1;
    const hasNoSentMessages = sentMessages.length === 0;

    if (hasNoSubscriptions) {
      TestUtils.log('🚨 ISSUE: No WebSocket subscriptions detected!', 'error');
    }

    if (hasMultipleConnections) {
      TestUtils.log(`🚨 ISSUE: ${newConnections.length} WebSocket connections created (should be 1)`, 'error');
    }

    if (hasNoSentMessages) {
      TestUtils.log('🚨 ISSUE: No WebSocket messages sent (no subscription attempts)', 'error');
    }

    // Analyze connection URLs
    const connectionUrls = new Set(newConnections.map(conn => conn.url));
    if (connectionUrls.size > 1) {
      console.log(`\n🔍 Multiple WebSocket URLs detected:`);
      Array.from(connectionUrls).forEach(url => {
        console.log(`  - ${url}`);
      });
    }
  });

  test('should trace WebSocket hook usage patterns', async ({ page }) => {
    TestUtils.log('Tracing WebSocket hook usage patterns...', 'debug');
    test.setTimeout(20000);

    // Monitor hook usage by intercepting specific functions
    await page.addInitScript(() => {
      // Hook into React DevTools if available
      let hookCalls: any[] = [];

      // Monitor for specific WebSocket-related function calls
      const originalCall = Function.prototype.call;
      Function.prototype.call = function(thisArg: any, ...args: any[]) {
        if (thisArg && thisArg.constructor && thisArg.constructor.name) {
          const funcName = this.name || 'anonymous';
          const constructorName = thisArg.constructor.name;

          if (['useWebSocket', 'WebSocketProvider', 'createWebSocket'].includes(constructorName) ||
              ['useWebSocket', 'createWebSocket'].includes(funcName)) {
            hookCalls.push({
              function: funcName,
              constructor: constructorName,
              args: args,
              timestamp: Date.now(),
            });
            console.log(`[HOOK] ${constructorName}.${funcName} called`, args);
          }
        }
        return originalCall.apply(this, [thisArg, ...args]);
      };

      // Store hook calls for later analysis
      (window as any).__wsHookCalls = hookCalls;
    });

    await page.waitForTimeout(3000);

    // Get hook call data
    const hookData = await page.evaluate(() => {
      return {
        hookCalls: (window as any).__wsHookCalls || [],
      };
    });

    console.log('\n=== WebSocket Hook Usage Analysis ===');
    console.log(`Hook calls detected: ${hookData.hookCalls.length}`);

    hookData.hookCalls.forEach((call, idx) => {
      console.log(`  ${idx + 1}. ${call.constructor}.${call.function}`);
      console.log(`     Arguments: ${call.args.slice(0, 2).map(a => JSON.stringify(a)).join(', ')}`);
    });

    TestUtils.log('WebSocket hook analysis complete', 'success');
  });

  test('should check for subscription triggering conditions', async ({ page }) => {
    TestUtils.log('Checking subscription triggering conditions...', 'debug');
    test.setTimeout(25000);

    // Wait and then check if subscriptions are triggered by user interaction
    await page.waitForTimeout(5000);

    const beforeInteraction = await page.evaluate(() => ({
      connections: window.__wsConnectionCount(),
      subscriptions: window.__wsSubscriptions.length,
      messages: window.__wsMessages.length,
    }));

    TestUtils.log(`Before interaction - Connections: ${beforeInteraction.connections}, Subscriptions: ${beforeInteraction.subscriptions}`, 'info');

    // Try to trigger subscriptions by navigating to trade page
    try {
      await page.goto(`${BASE_URL}/trade`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('Could not navigate to trade page:', e);
    }

    const afterNavigation = await page.evaluate(() => ({
      connections: window.__wsConnectionCount(),
      subscriptions: window.__wsSubscriptions.length,
      messages: window.__wsMessages.length,
      connectionEvents: window.__wsConnectionEvents(),
      allSubscriptions: window.__wsSubscriptions,
    }));

    TestUtils.log(`After navigation - Connections: ${afterNavigation.connections}, Subscriptions: ${afterNavigation.subscriptions}`, 'info');

    // Check if any new connections were created during navigation
    const newConnectionsAfterNav = afterNavigation.connectionEvents.filter(
      e => e.type === 'NEW_CONNECTION' && e.timestamp > Date.now() - 10000
    );

    console.log(`\n🔄 Navigation Impact Analysis:`);
    console.log(`  New connections after navigation: ${newConnectionsAfterNav.length}`);
    console.log(`  Total subscriptions: ${afterNavigation.allSubscriptions.length}`);

    if (afterNavigation.allSubscriptions.length > 0) {
      console.log('\n📡 Active Subscriptions:');
      afterNavigation.allSubscriptions.forEach((sub, idx) => {
        console.log(`  ${idx + 1}. ${sub.type} - Connection #${sub.id}`);
        if (sub.method) console.log(`     ${sub.method}: ${JSON.stringify(sub.params)}`);
        if (sub.data) console.log(`     Data: ${JSON.stringify(sub.data).substring(0, 100)}...`);
      });
    } else {
      console.log('\n❌ No subscriptions found - this indicates a potential issue with the subscription logic');
    }

    // Try clicking on trade elements to trigger subscriptions
    try {
      await page.click('[data-testid="trade-button"], .trade-button, button:has-text("Trade")');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Could not click trade button:', e);
    }

    const finalState = await page.evaluate(() => ({
      connections: window.__wsConnectionCount(),
      subscriptions: window.__wsSubscriptions.length,
      messages: window.__wsMessages.length,
    }));

    TestUtils.log(`Final state - Connections: ${finalState.connections}, Subscriptions: ${finalState.subscriptions}`, 'info');

    expect(finalState.subscriptions).toBeGreaterThanOrEqual(afterNavigation.subscriptions);
  });
});
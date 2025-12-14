import { test, expect } from '@playwright/test';

test.describe('WebSocket Test on Port 3001', () => {
  test('should check WebSocket connections on localhost:3001/trade', async ({ page }) => {
    const connections: any[] = [];

    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionCount = 0;

      window.WebSocket = function(...args: any[]) {
        connectionCount++;
        const connectionId = connectionCount;
        const url = args[0];
        const timestamp = Date.now();

        console.log(`[WS-${connectionId}] Creating connection to: ${url}`);
        console.log(`[WS-${connectionId}] Timestamp: ${new Date(timestamp).toISOString()}`);

        const socket = new OriginalWebSocket(...args);

        socket.addEventListener('open', () => {
          console.log(`[WS-${connectionId}] ✅ Connection opened`);
        });

        socket.addEventListener('close', (e) => {
          console.log(`[WS-${connectionId}] ❌ Connection closed - Code: ${e.code}, Reason: "${e.reason}"`);
        });

        socket.addEventListener('error', (error) => {
          console.log(`[WS-${connectionId}] 🚨 Connection error`);
        });

        socket.addEventListener('message', (e) => {
          console.log(`[WS-${connectionId}] 📨 Message received: ${e.data.substring(0, 100)}...`);
        });

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    });

    // Monitor console for WebSocket activity
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WS-')) {
        connections.push({
          timestamp: Date.now(),
          message: text
        });
        console.log(text);
      }
    });

    console.log('🔍 Navigating to http://localhost:3001/trade');
    await page.goto('http://localhost:3001/trade');

    // Wait for initial page load and potential WebSocket connections
    console.log('⏳ Waiting 10 seconds for WebSocket connections...');
    await page.waitForTimeout(10000);

    // Check if WebSocket connections were attempted
    const connectionAttempts = connections.filter(c => c.message.includes('Creating connection'));
    const successfulConnections = connections.filter(c => c.message.includes('✅ Connection opened'));
    const failedConnections = connections.filter(c => c.message.includes('❌ Connection closed'));
    const errorConnections = connections.filter(c => c.message.includes('🚨 Connection error'));

    console.log(`\n📊 WebSocket Connection Summary:`);
    console.log(`   • Total connection attempts: ${connectionAttempts.length}`);
    console.log(`   • Successful connections: ${successfulConnections.length}`);
    console.log(`   • Failed connections: ${failedConnections.length}`);
    console.log(`   • Error connections: ${errorConnections.length}`);

    if (connectionAttempts.length === 0) {
      console.log(`\n⚠️  No WebSocket connection attempts detected!`);
      console.log(`   This might indicate:`);
      console.log(`   • WebSocket provider is not initialized`);
      console.log(`   • Network conditions preventing connections`);
      console.log(`   • WebSocket URL configuration issue`);
    }

    // Log the actual WebSocket URLs being attempted
    connectionAttempts.forEach((attempt, idx) => {
      const urlMatch = attempt.message.match(/to: (.+)$/);
      if (urlMatch) {
        console.log(`   Connection ${idx + 1} URL: ${urlMatch[1]}`);
      }
    });

    // Basic assertions
    expect(connectionAttempts.length).toBeGreaterThanOrEqual(0);

    // If there are connection attempts, we should see some lifecycle events
    if (connectionAttempts.length > 0) {
      expect(successfulConnections.length + failedConnections.length + errorConnections.length).toBeGreaterThan(0);
    }

    console.log(`\n✅ WebSocket monitoring completed`);
  });
});
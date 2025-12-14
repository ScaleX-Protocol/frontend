import { test, expect } from '@playwright/test';

test.describe('WebSocket Loop Fix Verification', () => {
  test('should not create infinite reconnection loop after fix', async ({ page }) => {
    // Track WebSocket connections with timestamps
    const connections: { id: number; timestamp: number; type: string }[] = [];
    let connectionId = 0;

    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionCount = 0;

      window.WebSocket = function(...args: any[]) {
        connectionCount++;
        const connectionId = connectionCount;
        const timestamp = Date.now();
        const url = args[0];

        console.log(`[WS-${connectionId}] NEW ${url} at ${new Date(timestamp).toISOString()}`);

        const socket = new OriginalWebSocket(...args);

        socket.addEventListener('open', () => {
          console.log(`[WS-${connectionId}] OPEN at ${new Date(Date.now()).toISOString()}`);
        });

        socket.addEventListener('close', (e) => {
          console.log(`[WS-${connectionId}] CLOSE code=${e.code} reason="${e.reason}" at ${new Date(Date.now()).toISOString()}`);
        });

        socket.addEventListener('error', (error) => {
          console.log(`[WS-${connectionId}] ERROR at ${new Date(Date.now()).toISOString()}`);
        });

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    });

    // Monitor console logs for WebSocket events
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WS-')) {
        const parts = text.split(' ');
        const id = parseInt(parts[0].replace('[WS-', '').replace(']', ''));
        const type = parts[1];
        connections.push({
          id,
          timestamp: Date.now(),
          type
        });
        console.log(text);
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Monitor for 20 seconds
    console.log('Monitoring WebSocket connections for 20 seconds after fix...');
    await page.waitForTimeout(20000);

    // Analyze the connection pattern
    const newConnections = connections.filter(c => c.type === 'NEW');
    const openConnections = connections.filter(c => c.type === 'OPEN');
    const closeConnections = connections.filter(c => c.type === 'CLOSE');

    console.log(`\nConnection Analysis after fix:
- Total connections created: ${newConnections.length}
- Connections opened: ${openConnections.length}
- Connections closed: ${closeConnections.length}
- Duration: 20 seconds`);

    // The fix should prevent excessive connections
    // Allow for initial connection attempts but not infinite loops
    expect(newConnections.length).toBeLessThanOrEqual(4, `Too many connections created after fix: ${newConnections.length}`);

    // Check that we don't have continuous reconnections (loop)
    // A successful fix shows stable connection count over time
    const connectionsPerSecond = newConnections.length / 20;
    expect(connectionsPerSecond).toBeLessThan(0.3, `Connection rate too high: ${connectionsPerSecond} connections/second`);

    // After initial setup, we should have stable connections (no new ones)
    if (newConnections.length > 2) {
      // Count how many connections happened in the last 10 seconds
      const tenSecondsAgo = Date.now() - 10000;
      const recentConnections = connections.filter(c => c.timestamp > tenSecondsAgo && c.type === 'NEW').length;
      expect(recentConnections).toBeLessThanOrEqual(1, `Too many recent connections: ${recentConnections}`);
    }

    console.log('✅ WebSocket loop fix verified - no excessive reconnections detected');
  });
});
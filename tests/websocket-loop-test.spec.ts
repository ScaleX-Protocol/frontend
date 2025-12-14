import { test, expect } from '@playwright/test';

test.describe('WebSocket Loop Investigation', () => {
  test('should monitor WebSocket connections for looping', async ({ page }) => {
    // Track WebSocket connections
    const connectionLog: string[] = [];

    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionCount = 0;

      window.WebSocket = function(...args: any[]) {
        connectionCount++;
        const connectionId = connectionCount;
        const url = args[0];
        const timestamp = Date.now();

        console.log(`[WS-${connectionId}] Creating connection to ${url} at ${new Date(timestamp).toISOString()}`);

        const socket = new OriginalWebSocket(...args);

        socket.addEventListener('open', () => {
          console.log(`[WS-${connectionId}] Connection opened at ${new Date(Date.now()).toISOString()}`);
        });

        socket.addEventListener('close', (e) => {
          console.log(`[WS-${connectionId}] Connection closed at ${new Date(Date.now()).toISOString()}, code: ${e.code}, reason: ${e.reason}`);
        });

        socket.addEventListener('error', (error) => {
          console.log(`[WS-${connectionId}] Error: ${error}`);
        });

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    });

    // Monitor console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WS-')) {
        connectionLog.push(text);
        console.log(text);
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait and observe for 30 seconds
    console.log('Monitoring WebSocket connections for 30 seconds...');
    await page.waitForTimeout(30000);

    // Analyze connection patterns
    const connectionCreations = connectionLog.filter(log => log.includes('Creating connection'));
    const connectionsOpened = connectionLog.filter(log => log.includes('Connection opened'));
    const connectionsClosed = connectionLog.filter(log => log.includes('Connection closed'));

    console.log(`\nConnection Analysis:
- Total connections created: ${connectionCreations.length}
- Connections opened: ${connectionsOpened.length}
- Connections closed: ${connectionsClosed.length}
- Duration: 30 seconds`);

    // Check for excessive connections (more than 5 in 30 seconds is suspicious)
    if (connectionCreations.length > 5) {
      console.log('\n⚠️  POTENTIAL INFINITY LOOP DETECTED!');
      console.log('Connection creation timeline:');
      connectionCreations.forEach((log, idx) => {
        console.log(`  ${idx + 1}. ${log}`);
      });
    }

    // Assert reasonable connection count
    expect(connectionCreations.length).toBeLessThanOrEqual(5, `Too many WebSocket connections created: ${connectionCreations.length}`);

    // If we have connections, we should have successful opens
    if (connectionCreations.length > 0) {
      expect(connectionsOpened.length).toBeGreaterThan(0);
    }
  });

  test('check WebSocket endpoint configuration', async ({ page }) => {
    // Check what WebSocket URL the app is trying to connect to
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;

      window.WebSocket = function(...args: any[]) {
        const url = args[0];
        console.log(`[WS-URL] Attempting to connect to: ${url}`);

        // Check if URL is accessible
        fetch(url.replace('ws://', 'http://').replace('wss://', 'https://'), {
          method: 'GET',
          mode: 'no-cors'
        }).catch(() => {
          console.log(`[WS-URL] Failed to reach WebSocket server at ${url}`);
        });

        return new OriginalWebSocket(...args);
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    });

    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WS-URL]')) {
        consoleLogs.push(text);
        console.log(text);
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(5000);

    // Check if WebSocket URL is correct
    const wsUrlLogs = consoleLogs.filter(log => log.includes('Attempting to connect to'));
    expect(wsUrlLogs.length).toBeGreaterThan(0, 'No WebSocket connection attempts detected');
  });
});
import { test, expect } from '@playwright/test';

test.describe('WebSocket Subscription Tests', () => {
  test('should automatically subscribe to trading streams', async ({ page }) => {
    const subscriptionMessages: any[] = [];
    const websocketMessages: any[] = [];

    // Monitor WebSocket messages
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionCount = 0;

      window.WebSocket = function(...args: any[]) {
        connectionCount++;
        const connectionId = connectionCount;
        const url = args[0];

        console.log(`[WS-${connectionId}] Creating connection to: ${url}`);

        const socket = new OriginalWebSocket(...args);

        // Intercept send messages to see subscription requests
        const originalSend = socket.send.bind(socket);
        socket.send = function(data) {
          try {
            const message = JSON.parse(data);
            if (message.method === 'SUBSCRIBE') {
              console.log(`[WS-${connectionId}] 📡 SUBSCRIBE: ${message.params.join(', ')}`);
              window.subscriptionMessages = window.subscriptionMessages || [];
              window.subscriptionMessages.push({
                type: 'SUBSCRIBE',
                streams: message.params,
                timestamp: Date.now()
              });
            }
            if (message.method === 'UNSUBSCRIBE') {
              console.log(`[WS-${connectionId}] ❌ UNSUBSCRIBE: ${message.params.join(', ')}`);
            }
          } catch (e) {
            // Not JSON, ignore
          }
          return originalSend(data);
        };

        socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.stream) {
              console.log(`[WS-${connectionId}] 📨 STREAM ${data.stream}: ${JSON.stringify(data.data).substring(0, 100)}...`);
              window.websocketMessages = window.websocketMessages || [];
              window.websocketMessages.push({
                stream: data.stream,
                data: data.data,
                timestamp: Date.now()
              });
            } else if (data.result) {
              console.log(`[WS-${connectionId}] ✅ SUBSCRIPTION RESPONSE: ${JSON.stringify(data.result)}`);
            }
          } catch (e) {
            console.log(`[WS-${connectionId}] 📨 Raw message: ${event.data.substring(0, 100)}...`);
          }
        });

        socket.addEventListener('open', () => {
          console.log(`[WS-${connectionId}] ✅ Connection opened`);
        });

        socket.addEventListener('close', (e) => {
          console.log(`[WS-${connectionId}] ❌ Connection closed - Code: ${e.code}, Reason: ${e.reason}`);
        });

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    });

    // Collect data from page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WS-')) {
        console.log(text);
      }
    });

    // Navigate to trade page where subscriptions should happen
    console.log('🔍 Navigating to http://localhost:3001/trade');
    await page.goto('http://localhost:3001/trade');

    // Wait for page to load and WebSocket subscriptions to be sent
    console.log('⏳ Waiting 10 seconds for WebSocket subscriptions...');
    await page.waitForTimeout(10000);

    // Check for subscription attempts
    const subscriptionData = await page.evaluate(() => {
      return {
        subscriptions: window.subscriptionMessages || [],
        messages: window.websocketMessages || []
      };
    });

    console.log('\n📊 Subscription Analysis:');
    console.log(`   • Subscription requests: ${subscriptionData.subscriptions.length}`);
    console.log(`   • Stream messages received: ${subscriptionData.messages.length}`);

    // Log all subscription attempts
    if (subscriptionData.subscriptions.length > 0) {
      console.log('\n📡 Subscription Requests:');
      subscriptionData.subscriptions.forEach((sub: any, idx: number) => {
        console.log(`   ${idx + 1}. ${sub.streams.join(', ')}`);
      });
    }

    // Log all received stream messages
    if (subscriptionData.messages.length > 0) {
      console.log('\n📨 Stream Messages Received:');
      const streamCounts: { [key: string]: number } = {};
      subscriptionData.messages.forEach((msg: any) => {
        streamCounts[msg.stream] = (streamCounts[msg.stream] || 0) + 1;
      });
      Object.entries(streamCounts).forEach(([stream, count]) => {
        console.log(`   • ${stream}: ${count} messages`);
      });
    }

    // Assert that subscriptions are being made
    expect(subscriptionData.subscriptions.length).toBeGreaterThan(0, 'No WebSocket subscriptions were sent');

    // Check for expected trading stream subscriptions
    const subscriptionStreams = subscriptionData.subscriptions.flatMap((sub: any) => sub.streams);
    const expectedStreams = ['depth', 'trade', 'miniTicker'];
    const hasTradingStreams = expectedStreams.some(stream =>
      subscriptionStreams.some((subStream: string) => subStream.includes(stream))
    );

    expect(hasTradingStreams).toBe(true, `No trading stream subscriptions found. Subscribed to: ${subscriptionStreams.join(', ')}`);

    console.log('\n✅ WebSocket subscription system is working!');
  });

  test('should handle symbol-based subscriptions', async ({ page }) => {
    // Test that subscriptions use the correct symbol format
    const subscriptionRequests: string[] = [];

    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;

      window.WebSocket = function(...args: any[]) {
        const socket = new OriginalWebSocket(...args);

        const originalSend = socket.send.bind(socket);
        socket.send = function(data) {
          try {
            const message = JSON.parse(data);
            if (message.method === 'SUBSCRIBE') {
              window.subscriptionRequests = window.subscriptionRequests || [];
              window.subscriptionRequests.push(...message.params);
            }
          } catch (e) {
            // Not JSON, ignore
          }
          return originalSend(data);
        };

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
    });

    page.on('console', msg => {
      console.log(msg.text());
    });

    await page.goto('http://localhost:3001/trade');
    await page.waitForTimeout(8000);

    const requests = await page.evaluate(() => window.subscriptionRequests || []);

    console.log('\n📡 Subscription Requests:');
    requests.forEach((stream: string, idx: number) => {
      console.log(`   ${idx + 1}. ${stream}`);
    });

    // Check if streams follow the expected pattern (symbol@stream_type)
    const validStreamPattern = /^[a-z]+@[a-z]+$/;
    const validStreams = requests.filter(stream => validStreamPattern.test(stream));

    console.log(`\n✅ Valid stream format: ${validStreams.length}/${requests.length}`);

    // We should have at least some properly formatted streams
    expect(validStreams.length).toBeGreaterThan(0, 'No properly formatted stream subscriptions found');

    console.log('✅ Symbol-based subscription format validated!');
  });
});
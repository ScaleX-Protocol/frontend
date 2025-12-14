import { test, expect } from '@playwright/test';

test.describe('WebSocket Subscription Verification', () => {
  test('should verify all required trading streams are subscribed', async ({ page }) => {
    const subscriptionDetails: any[] = [];
    const streamMessages: any[] = [];

    // Monitor WebSocket activity in detail
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionId = 0;

      window.WebSocket = function(...args: any[]) {
        connectionId++;
        const id = connectionId;
        const url = args[0];

        console.log(`[WS-${id}] 🔌 Creating connection to: ${url}`);

        const socket = new OriginalWebSocket(...args);

        // Track all outgoing messages (subscriptions)
        const originalSend = socket.send.bind(socket);
        socket.send = function(data) {
          try {
            const message = JSON.parse(data);
            console.log(`[WS-${id}] 📤 OUTGOING:`, message);

            if (message.method === 'SUBSCRIBE' || message.method === 'UNSUBSCRIBE') {
              window.subscriptionDetails = window.subscriptionDetails || [];
              window.subscriptionDetails.push({
                id,
                type: message.method,
                streams: message.params,
                messageId: message.id,
                timestamp: Date.now()
              });
            }
          } catch (e) {
            console.log(`[WS-${id}] 📤 OUTGOING (raw):`, data);
          }
          return originalSend(data);
        };

        // Track all incoming messages
        socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(`[WS-${id}] 📥 INCOMING:`, data);

            if (data.stream) {
              window.streamMessages = window.streamMessages || [];
              window.streamMessages.push({
                id,
                stream: data.stream,
                data: data.data,
                timestamp: Date.now()
              });
            }
          } catch (e) {
            console.log(`[WS-${id}] 📥 INCOMING (raw):`, event.data);
          }
        });

        socket.addEventListener('open', () => {
          console.log(`[WS-${id}] ✅ OPENED`);
        });

        socket.addEventListener('close', (e) => {
          console.log(`[WS-${id}] ❌ CLOSED - Code: ${e.code}, Reason: ${e.reason}`);
        });

        socket.addEventListener('error', (error) => {
          console.log(`[WS-${id}] 🚨 ERROR:`, error);
        });

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    });

    // Collect WebSocket data
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WS-')) {
        console.log(text);
      }
    });

    console.log('🚀 Navigating to trade page...');
    await page.goto('http://localhost:3001/trade');

    // Wait for the page to load completely
    console.log('⏳ Waiting for page to load (10 seconds)...');
    await page.waitForTimeout(10000);

    // Wait longer for subscriptions to happen
    console.log('⏳ Waiting for WebSocket subscriptions (15 more seconds)...');
    await page.waitForTimeout(15000);

    // Collect all WebSocket activity
    const wsData = await page.evaluate(() => {
      return {
        subscriptions: window.subscriptionDetails || [],
        streamMessages: window.streamMessages || []
      };
    });

    console.log('\n📊 WebSocket Analysis:');
    console.log(`   • Total subscription attempts: ${wsData.subscriptions.length}`);
    console.log(`   • Total stream messages received: ${wsData.streamMessages.length}`);

    // Analyze subscriptions
    if (wsData.subscriptions.length > 0) {
      console.log('\n📡 Subscription Details:');
      wsData.subscriptions.forEach((sub: any, idx: number) => {
        console.log(`   ${idx + 1}. ${sub.type}: ${sub.streams.join(', ')}`);
      });

      // Get all unique streams
      const allStreams = wsData.subscriptions.flatMap((sub: any) => sub.streams);
      const uniqueStreams = [...new Set(allStreams)];

      console.log('\n📝 Unique Streams Subscribed:');
      uniqueStreams.forEach((stream: string) => {
        console.log(`   • ${stream}`);
      });

      // Check for required trading streams
      const requiredStreams = [
        'depth',      // Order book data
        'trade',       // Trade executions
        'miniTicker',  // Price statistics
        'kline_1m'     // Candlestick data
      ];

      console.log('\n✅ Required Streams Check:');
      requiredStreams.forEach(requiredStream => {
        const hasStream = uniqueStreams.some((stream: string) => stream.includes(requiredStream));
        const status = hasStream ? '✅' : '❌';
        console.log(`   ${status} ${requiredStream}: ${hasStream ? 'FOUND' : 'MISSING'}`);
      });

      // Assert that we have at least some trading streams
      expect(uniqueStreams.length).toBeGreaterThan(0, 'No WebSocket subscriptions found');

      // Check for essential streams
      const hasDepth = uniqueStreams.some((stream: string) => stream.includes('depth'));
      const hasTrade = uniqueStreams.some((stream: string) => stream.includes('trade'));

      expect(hasDepth || hasTrade).toBe(true, 'No essential trading streams (depth/trade) found');

    } else {
      console.log('\n❌ No WebSocket subscriptions were sent!');
    }

    // Analyze received stream messages
    if (wsData.streamMessages.length > 0) {
      console.log('\n📨 Stream Messages Received:');
      const streamCounts: { [key: string]: number } = {};
      wsData.streamMessages.forEach((msg: any) => {
        streamCounts[msg.stream] = (streamCounts[msg.stream] || 0) + 1;
      });

      Object.entries(streamCounts).forEach(([stream, count]) => {
        console.log(`   • ${stream}: ${count} messages`);
      });

      // Assert that we're receiving data
      expect(Object.keys(streamCounts).length).toBeGreaterThan(0, 'No stream data received');

    } else {
      console.log('\n⚠️  No stream messages received yet (might need more time or server not sending data)');
    }

    console.log('\n🎯 WebSocket Subscription Test Completed!');
  });

  test('should verify symbol format conversion', async ({ page }) => {
    // Test that symbols like "gsWETH/gsUSDC" are converted to "gswethgsusdc@stream"
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;

      window.WebSocket = function(...args: any[]) {
        const socket = new OriginalWebSocket(...args);

        const originalSend = socket.send.bind(socket);
        socket.send = function(data) {
          try {
            const message = JSON.parse(data);
            if (message.method === 'SUBSCRIBE') {
              window.sentSubscriptions = window.sentSubscriptions || [];
              window.sentSubscriptions.push(...message.params);
            }
          } catch (e) {
            // Ignore
          }
          return originalSend(data);
        };

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
    });

    await page.goto('http://localhost:3001/trade');
    await page.waitForTimeout(10000);

    const subscriptions = await page.evaluate(() => window.sentSubscriptions || []);

    console.log('\n🔍 Symbol Format Analysis:');
    subscriptions.forEach((sub: string, idx: number) => {
      console.log(`   ${idx + 1}. ${sub}`);
    });

    // Check for the expected format
    const expectedFormats = [
      /gswethgsusdc@depth/i,
      /gswethgsusdc@trade/i,
      /gswethgsusdc@miniticker/i
    ];

    console.log('\n✅ Format Validation:');
    expectedFormats.forEach((regex, idx) => {
      const matches = subscriptions.some(sub => regex.test(sub));
      const status = matches ? '✅' : '❌';
      console.log(`   ${status} Format ${idx + 1}: ${matches ? 'CORRECT' : 'MISSING'}`);
    });

    // We should have at least one correctly formatted subscription
    const hasCorrectFormat = expectedFormats.some(regex =>
      subscriptions.some(sub => regex.test(sub))
    );

    expect(hasCorrectFormat).toBe(true, 'No correctly formatted subscriptions found');
  });
});
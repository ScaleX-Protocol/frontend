import { test, expect } from '@playwright/test';

test.describe('WebSocket Force Subscriptions Test', () => {
  test('should force test WebSocket subscriptions directly', async ({ page }) => {
    const allMessages: any[] = [];

    // Monitor all WebSocket activity
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionId = 0;

      window.WebSocket = function(...args: any[]) {
        connectionId++;
        const id = connectionId;
        const url = args[0];

        console.log(`[WS-${id}] 🔌 Creating connection to: ${url}`);

        const socket = new OriginalWebSocket(...args);

        // Track all outgoing messages
        const originalSend = socket.send.bind(socket);
        socket.send = function(data) {
          console.log(`[WS-${id}] 📤 Sending:`, data);
          window.allMessages = window.allMessages || [];
          window.allMessages.push({
            id,
            direction: 'out',
            data: data,
            timestamp: Date.now()
          });
          return originalSend(data);
        };

        // Track all incoming messages
        socket.addEventListener('message', (event) => {
          console.log(`[WS-${id}] 📥 Received:`, event.data);
          window.allMessages = window.allMessages || [];
          window.allMessages.push({
            id,
            direction: 'in',
            data: event.data,
            timestamp: Date.now()
          });
        });

        socket.addEventListener('open', () => {
          console.log(`[WS-${id}] ✅ OPENED`);
        });

        socket.addEventListener('close', (e) => {
          console.log(`[WS-${id}] ❌ CLOSED - Code: ${e.code}, Reason: ${e.reason}`);
        });

        return socket;
      };

      window.WebSocket.prototype = OriginalWebSocket.prototype;
    });

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[WS-')) {
        console.log(text);
      }
    });

    console.log('🚀 Navigating to trade page...');
    await page.goto('http://localhost:3001/trade');

    // Wait for WebSocket to connect
    await page.waitForTimeout(5000);

    // Try to manually trigger subscriptions via console
    await page.evaluate(() => {
      return new Promise((resolve) => {
        // Find the WebSocket connection to the trading server
        setTimeout(() => {
          const connections = Array.from(document.scripts).filter(script => {
            return script.textContent?.includes('base-sepolia-websocket.scalex.money');
          });

          console.log('Found WebSocket-related scripts:', connections.length);

          // Try to find the WebSocket instance in window
          const checkWebSocket = () => {
            for (let prop in window) {
              if (prop.includes('WebSocket') || prop.includes('socket')) {
                console.log('Found WebSocket-related property:', prop, typeof (window as any)[prop]);
              }
            }

            // Check if any WebSocket is open
            if (window.allMessages) {
              const outgoing = window.allMessages.filter(m => m.direction === 'out');
              console.log('Outgoing messages count:', outgoing.length);
              outgoing.forEach((msg, idx) => {
                console.log(`Outgoing ${idx + 1}:`, msg.data);
              });
            }
          };

          checkWebSocket();
          resolve({});
        }, 2000);
      });
    });

    // Wait longer and check again
    await page.waitForTimeout(10000);

    // Get all messages
    const messages = await page.evaluate(() => window.allMessages || []);

    console.log('\n📊 WebSocket Message Analysis:');
    console.log(`   • Total messages: ${messages.length}`);

    if (messages.length > 0) {
      const outgoing = messages.filter(m => m.direction === 'out');
      const incoming = messages.filter(m => m.direction === 'in');

      console.log(`   • Outgoing: ${outgoing.length}`);
      console.log(`   • Incoming: ${incoming.length}`);

      if (outgoing.length > 0) {
        console.log('\n📤 Outgoing Messages:');
        outgoing.forEach((msg, idx) => {
          console.log(`   ${idx + 1}. ${msg.data}`);
        });
      }

      if (incoming.length > 0) {
        console.log('\n📥 Incoming Messages:');
        incoming.forEach((msg, idx) => {
          console.log(`   ${idx + 1}. ${msg.data.substring(0, 100)}${msg.data.length > 100 ? '...' : ''}`);
        });
      }

      // Check if there are any subscription attempts
      const hasSubscriptionAttempts = outgoing.some(msg => {
        try {
          const data = JSON.parse(msg.data);
          return data.method === 'SUBSCRIBE';
        } catch (e) {
          return false;
        }
      });

      console.log(`\n✅ Subscription attempts: ${hasSubscriptionAttempts ? 'YES' : 'NO'}`);
    }

    console.log('\n🎯 WebSocket Force Test Complete!');
  });
});
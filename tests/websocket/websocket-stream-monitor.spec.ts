/**
 * WebSocket Stream Monitoring Test
 *
 * This test monitors what WebSocket streams are actually available
 * and receives real-time data from the server.
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, TestUtils } from '../config/test-config';

const { BASE_URL } = TEST_CONFIG;

test.describe('WebSocket Stream Monitoring', () => {

  test('should monitor available streams and data flow', async ({ page }) => {
    TestUtils.log('Monitoring WebSocket stream availability...', 'debug');
    test.setTimeout(30000); // 30 seconds to capture data

    // Monitor WebSocket messages for extended period
    await page.addInitScript(() => {
      const OriginalWebSocket = window.WebSocket;
      let connectionId = 1;
      let messages: any[] = [];

      window.WebSocket = function(...args: any[]) {
        const url = args[0];

        // Only monitor the application WebSocket, not HMR
        if (url.includes('base-sepolia-websocket.scalex.money')) {
          console.log(`[WS_MONITOR] Creating connection #${connectionId} to ${url}`);

          const socket = new OriginalWebSocket(...args);

          const originalSend = socket.send;
          socket.send = function(data: any) {
            try {
              const parsedData = JSON.parse(data);
              console.log(`[WS_MONITOR] SENT:`, parsedData);
              messages.push({ type: 'SENT', data: parsedData, timestamp: Date.now() });
            } catch (e) {
              console.log(`[WS_MONITOR] SENT (raw):`, data);
              messages.push({ type: 'SENT', data: data, timestamp: Date.now() });
            }
            return originalSend.call(socket, data);
          };

          socket.addEventListener('message', (event) => {
            try {
              const parsedData = JSON.parse(event.data);
              console.log(`[WS_MONITOR] RECEIVED:`, parsedData);
              messages.push({ type: 'RECEIVED', data: parsedData, timestamp: Date.now() });
            } catch (e) {
              console.log(`[WS_MONITOR] RECEIVED (raw):`, event.data);
              messages.push({ type: 'RECEIVED', data: event.data, timestamp: Date.now() });
            }
          });

          socket.addEventListener('open', () => {
            console.log(`[WS_MONITOR] Connection #${connectionId} OPENED`);
          });

          socket.addEventListener('close', () => {
            console.log(`[WS_MONITOR] Connection #${connectionId} CLOSED`);
          });

          socket.addEventListener('error', (error) => {
            console.log(`[WS_MONITOR] Connection #${connectionId} ERROR:`, error);
          });

          connectionId++;

          // Store messages for analysis
          (window as any).__wsMonitorMessages = messages;
        } else {
          // HMR WebSocket - pass through unchanged
          return new OriginalWebSocket(...args);
        }

        return socket;
      };

      // Preserve WebSocket properties
      window.WebSocket.prototype = OriginalWebSocket.prototype;
      window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      window.WebSocket.OPEN = OriginalWebSocket.OPEN;
      window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
      window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Wait for initial connection and subscriptions
    await page.waitForTimeout(5000);

    TestUtils.log('WebSocket connected and subscriptions sent. Monitoring data flow...', 'info');

    // Monitor for 20 seconds to capture any real-time data
    await page.waitForTimeout(20000);

    // Analyze captured messages
    const analysis = await page.evaluate(() => {
      const messages = (window as any).__wsMonitorMessages || [];

      const sentMessages = messages.filter(m => m.type === 'SENT');
      const receivedMessages = messages.filter(m => m.type === 'RECEIVED');

      const subscriptionRequests = sentMessages.filter(m =>
        m.data.method === 'SUBSCRIBE'
      );

      const connectionAcks = receivedMessages.filter(m =>
        m.data.result === 'connected'
      );

      const subscriptionAcks = receivedMessages.filter(m =>
        m.data.result && Array.isArray(m.data.result)
      );

      const streamData = receivedMessages.filter(m =>
        m.data.stream || m.data.type
      );

      return {
        totalMessages: messages.length,
        sentCount: sentMessages.length,
        receivedCount: receivedMessages.length,
        subscriptionRequests: subscriptionRequests.length,
        connectionAcks: connectionAcks.length,
        subscriptionAcks: subscriptionAcks.length,
        streamDataCount: streamData.length,
        requestedStreams: subscriptionRequests.map(m => m.data.params).flat(),
        confirmedStreams: subscriptionAcks.map(m => m.data.result).flat(),
        streamDataTypes: streamData.map(m => m.data.stream || m.data.type),
        allReceivedMessages: receivedMessages
      };
    });

    console.log('\n=== WebSocket Stream Analysis ===');
    console.log(`Total messages: ${analysis.totalMessages}`);
    console.log(`Sent: ${analysis.sentCount}, Received: ${analysis.receivedCount}`);
    console.log(`Connection acknowledgments: ${analysis.connectionAcks}`);
    console.log(`Subscription requests: ${analysis.subscriptionRequests}`);
    console.log(`Subscription confirmations: ${analysis.subscriptionAcks}`);
    console.log(`Stream data messages: ${analysis.streamDataCount}`);

    console.log('\n📤 Requested Streams:');
    analysis.requestedStreams.forEach((stream, idx) => {
      console.log(`  ${idx + 1}. ${stream}`);
    });

    console.log('\n✅ Confirmed Streams:');
    analysis.confirmedStreams.forEach((stream, idx) => {
      console.log(`  ${idx + 1}. ${stream}`);
    });

    if (analysis.streamDataCount > 0) {
      console.log('\n📥 Stream Data Types:');
      analysis.streamDataTypes.forEach((type, idx) => {
        console.log(`  ${idx + 1}. ${type}`);
      });
    }

    console.log('\n📋 All Received Messages:');
    analysis.allReceivedMessages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. ${JSON.stringify(msg.data)}`);
    });

    // Verify basic functionality
    expect(analysis.subscriptionRequests).toBeGreaterThan(0);
    expect(analysis.connectionAcks).toBeGreaterThan(0);
    expect(analysis.sentCount).toBeGreaterThan(0);
    expect(analysis.receivedCount).toBeGreaterThan(0);

    TestUtils.log(`WebSocket analysis complete. Confirmed ${analysis.subscriptionAcks} out of ${analysis.subscriptionRequests} requested streams.`, 'info');

    if (analysis.streamDataCount > 0) {
      TestUtils.log(`🎉 Real-time data received! ${analysis.streamDataCount} stream data messages.`, 'success');
    } else {
      TestUtils.log('ℹ️ No stream data received in monitoring period (may be normal for low-activity periods).', 'info');
    }
  });
});
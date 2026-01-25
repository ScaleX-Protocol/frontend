// Import polyfills in the correct order
// CRITICAL: react-native-get-random-values MUST come before @ethersproject/shims
import 'react-native-get-random-values';
import '@ethersproject/shims';
import '@walletconnect/react-native-compat';
import { Buffer } from 'buffer';
// @ts-ignore - no types available for fast-text-encoding
import { TextEncoder, TextDecoder } from 'fast-text-encoding';
import * as crypto from 'expo-crypto';
import { startNetworkLogging } from 'react-native-network-logger';

// Polyfill for node globals
if (typeof global !== 'undefined') {
  // @ts-ignore
  global.Buffer = Buffer;

  // Add crypto polyfill for uuid package
  if (!global.crypto) {
    // @ts-ignore
    global.crypto = {
      getRandomValues: (array: any) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
      randomUUID: () => {
        return crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`;
      },
    };
  }

  // Add TextEncoder/TextDecoder for Privy (required for jose package)
  if (!global.TextEncoder) {
    // @ts-ignore
    global.TextEncoder = TextEncoder;
  }
  if (!global.TextDecoder) {
    // @ts-ignore
    global.TextDecoder = TextDecoder;
  }

  // Minimal process polyfill
  if (!global.process) {
    // @ts-ignore
    global.process = {
      env: { NODE_ENV: __DEV__ ? 'development' : 'production' } as NodeJS.ProcessEnv,
      version: '',
      nextTick: (fn: any) => setTimeout(fn, 0),
    };
  } else if (!global.process.env) {
    // @ts-ignore
    global.process.env = { NODE_ENV: __DEV__ ? 'development' : 'production' } as NodeJS.ProcessEnv;
  }
}

// Start network logging in development
if (__DEV__) {
  startNetworkLogging();
}

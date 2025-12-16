import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@scalex/base-utils': fileURLToPath(new URL('../../packages/@scalex/base-utils/src', import.meta.url)),
      '@scalex/types': fileURLToPath(new URL('../../packages/@scalex/types/src', import.meta.url)),
      '@scalex/api-client': fileURLToPath(new URL('../../packages/@scalex/api-client/src', import.meta.url)),
      '@scalex/persist-store': fileURLToPath(new URL('../../packages/@scalex/persist-store/src', import.meta.url)),
      '@scalex/service-wallet': fileURLToPath(new URL('../../packages/@scalex/service-wallet/src', import.meta.url)),
      '@scalex/service-trading': fileURLToPath(new URL('../../packages/@scalex/service-trading/src', import.meta.url)),
      '@scalex/service-lending': fileURLToPath(new URL('../../packages/@scalex/service-lending/src', import.meta.url)),
      // Force all Privy imports to resolve to a single instance
      '@privy-io/react-auth': fileURLToPath(new URL('../../node_modules/@privy-io/react-auth', import.meta.url)),
      buffer: 'buffer',
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-router',
      '@tanstack/react-query',
      '@privy-io/react-auth',
      'viem',
      'wagmi',
      'buffer',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});
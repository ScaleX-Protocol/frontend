import { defineConfig, type Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath, URL } from 'node:url';
import fs from 'fs';
import { minikitConfig } from './minikit.config';
import { withValidManifest } from '@coinbase/onchainkit/minikit';

function farcasterManifestPlugin(): Plugin {
  const manifest = JSON.stringify(withValidManifest(minikitConfig));

  return {
    name: 'farcaster-manifest',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/.well-known/farcaster.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(manifest);
          return;
        }
        next();
      });
    },
    writeBundle() {
      const outDir = 'dist/.well-known';
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      fs.writeFileSync(`${outDir}/farcaster.json`, manifest);
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [
    farcasterManifestPlugin(),
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
      // '@privy-io/react-auth': fileURLToPath(new URL('../../node_modules/@privy-io/react-auth', import.meta.url)),
      // Privy subpath export alias for pnpm monorepo compatibility
      '@privy-io/react-auth/solana': fileURLToPath(new URL('../../node_modules/@privy-io/react-auth/dist/esm/solana.mjs', import.meta.url)),
      buffer: 'buffer',
    },
    // Important for pnpm monorepo - follow symlinks to real paths
    preserveSymlinks: false,
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    // Disable source maps in production to reduce memory usage during build
    // Source maps for 1.8MB chunks can consume several GB of RAM
    sourcemap: false,
    // Disable gzip size reporting to save memory
    reportCompressedSize: false,
    // Increase chunk size warning limit to avoid warnings for large vendor chunks
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress PURE annotation warnings from dependencies
        // These are harmless warnings about comment positions that don't affect the build output
        // Affects: @privy-io/react-auth (React Native code), ox, and other dependencies
        if (
          warning.code === 'INVALID_ANNOTATION' &&
          warning.message?.includes('/*#__PURE__*/')
        ) {
          return;
        }
        // Show other warnings
        warn(warning);
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['@tanstack/react-router', '@tanstack/react-query'],
          'wallet-vendor': ['@privy-io/react-auth', 'viem', 'wagmi'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'recharts'],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.1'),
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-router',
      '@tanstack/react-query',
      '@privy-io/react-auth',
      '@privy-io/react-auth/solana',
      '@wallet-standard/app',
      'viem',
      'wagmi',
      'buffer',
    ],
    exclude: [
      // Exclude React Native to avoid processing mobile-specific code
      'react-native',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
}});
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
      // @scalex/* packages are resolved automatically by vite-tsconfig-paths
      // via pnpm workspace symlinks — no manual aliasing needed.
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
    // Lower limit to catch oversized chunks early
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      // Externalize react and react-dom so Rollup completely skips parsing them.
      // They will be loaded from CDN <script> tags in index.html.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom/client'],
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
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'React',
          'react/jsx-dev-runtime': 'React',
          'react-dom/client': 'ReactDOM',
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@privy-io')) return 'vendor-privy';
            if (id.includes('viem')) return 'vendor-viem';
            if (id.includes('wagmi')) return 'vendor-wagmi';
            if (id.includes('@solana')) return 'vendor-solana';
            if (id.includes('@reown')) return 'vendor-reown';
            if (id.includes('ox/') || id.includes('abitype/')) return 'vendor-evm-utils';
            if (id.includes('@coinbase')) return 'vendor-coinbase';
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('framer-motion')) return 'vendor-framer';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            return 'vendor-core';
          }
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
      // react and react-dom are externalized — do NOT include them here
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
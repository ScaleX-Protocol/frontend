import { defineConfig, type Plugin } from 'vite';
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

export default defineConfig({
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
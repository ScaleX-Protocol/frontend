const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Simplify configuration - keep only essential monorepo support
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add SVG support
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
  extraNodeModules: {
    // Force single copies of React and react-query across the monorepo
    // to prevent "Invalid hook call" errors from duplicate instances
    react: path.resolve(projectRoot, 'node_modules/react'),
    'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    '@tanstack/react-query': path.resolve(projectRoot, 'node_modules/@tanstack/react-query'),
    // Node polyfills
    stream: require.resolve('readable-stream'),
    util: require.resolve('util'),
    fs: require.resolve('empty-module'),
    path: require.resolve('empty-module'),
    crypto: require.resolve('empty-module'),
    os: require.resolve('empty-module'),
    http: require.resolve('empty-module'),
    https: require.resolve('empty-module'),
  },
  alias: {
    '@': path.resolve(projectRoot),
    '~': path.resolve(projectRoot),
  },
  // Force single-instance resolution for React ecosystem packages.
  // In a pnpm monorepo, shared packages (e.g. @scalex/api) resolve
  // react and react-query from the root (react@19.2.3) instead of
  // the mobile app (react@19.1.0), causing "Invalid hook call" errors.
  // We pre-resolve paths and return them directly to bypass pnpm symlinks.
  resolveRequest: (() => {
    // Pre-resolve singleton package paths at startup from mobile's context
    const singletonPaths = {};
    const singletonModules = [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
    ];
    for (const mod of singletonModules) {
      try {
        singletonPaths[mod] = require.resolve(mod, { paths: [projectRoot] });
      } catch (e) {
        console.warn(`[metro.config] Could not pre-resolve ${mod}:`, e.message);
      }
    }
    console.log('[metro.config] Singleton paths:', singletonPaths);

    return (context, moduleName, platform) => {
      // Return pre-resolved paths directly for singleton packages
      if (singletonPaths[moduleName]) {
        return { type: 'sourceFile', filePath: singletonPaths[moduleName] };
      }

      // Disable package exports for isows (viem dependency)
      if (moduleName === 'isows') {
        const ctx = {
          ...context,
          unstable_enablePackageExports: false,
        };
        return ctx.resolveRequest(ctx, moduleName, platform);
      }

      // Disable package exports for zustand@4
      if (moduleName.startsWith('zustand')) {
        const ctx = {
          ...context,
          unstable_enablePackageExports: false,
        };
        return ctx.resolveRequest(ctx, moduleName, platform);
      }

      // Use browser version for jose
      if (moduleName === 'jose') {
        const ctx = {
          ...context,
          unstable_enablePackageExports: true,
          unstable_conditionNames: ['browser'],
        };
        return ctx.resolveRequest(ctx, moduleName, platform);
      }

      // Enable package exports for @privy-io/ packages (for React Native 0.78 or older)
      if (moduleName.startsWith('@privy-io/')) {
        const ctx = {
          ...context,
          unstable_enablePackageExports: true,
        };
        return ctx.resolveRequest(ctx, moduleName, platform);
      }

      return context.resolveRequest(context, moduleName, platform);
    };
  })(),
};

module.exports = withNativeWind(config, { input: './global.css' });

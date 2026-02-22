const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Simplify configuration - keep only essential monorepo support
// Merge with Expo's defaults instead of replacing
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

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
    stream: require.resolve('readable-stream'),
    util: require.resolve('util'),
    // Force a single copy of these packages across all workspace packages.
    // Without this, @scalex/service-wallet resolves @privy-io/expo from a
    // different module instance than the PrivyProvider in the app, causing
    // usePrivy() to return null (mismatched React Context).
    react: path.resolve(projectRoot, 'node_modules/react'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    '@privy-io/expo': path.resolve(projectRoot, 'node_modules/@privy-io/expo'),
  },
  alias: {
    '@': path.resolve(projectRoot),
    '~': path.resolve(projectRoot),
  },
  // Privy-specific package resolution (from official docs)
  resolveRequest: (context, moduleName, platform) => {
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
  },
};

module.exports = withNativeWind(config, { input: './global.css' });

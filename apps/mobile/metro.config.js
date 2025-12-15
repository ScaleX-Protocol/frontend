const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure Metro can resolve all file extensions including .cjs and .mjs
config.resolver.sourceExts = [
  'expo.ts',
  'expo.tsx',
  'expo.js',
  'expo.jsx',
  'ts',
  'tsx',
  'js',
  'jsx',
  'cjs',
  'mjs',
  'json',
  'wasm',
  'svg',
];

// Add support for the @scalex/* packages by pointing directly to their directories
// This allows Metro to resolve them as if they were regular node_modules
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      if (name.toString().startsWith('@scalex/')) {
        const packageName = name.toString().replace('@scalex/', '');
        return path.join(workspaceRoot, 'packages', '@scalex', packageName);
      }
      return target[name];
    },
  }
);

module.exports = withNativeWind(config, { input: './global.css' });
